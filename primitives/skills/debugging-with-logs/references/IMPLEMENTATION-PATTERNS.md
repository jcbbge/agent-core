# Implementation Patterns by Framework

Framework-specific examples for implementing wide events. All examples follow the same pattern: initialize event early, enrich throughout lifecycle, emit once at the end.

**Primary languages**: JavaScript (Node.js, Express, Next.js) and PHP (Laravel, vanilla PHP)  
**Also included**: Python (Flask, FastAPI), Go, Rust, and client-side JavaScript (React)  
**Works everywhere**: The pattern is universal - adapt to any language that outputs JSON

## Table of Contents
- [Express.js (Node.js)](#expressjs-nodejs)
- [Next.js (App Router)](#nextjs-app-router)
- [PHP (Laravel)](#php-laravel)
- [PHP (Generic/Vanilla)](#php-genericvanilla)
- [Flask (Python)](#flask-python)
- [FastAPI (Python)](#fastapi-python)
- [Go (net/http)](#go-nethttp)
- [Rust (Axum)](#rust-axum)
- [Client-Side (React)](#client-side-react)

## Express.js (Node.js)

### Middleware Setup

```javascript
// middleware/wideEvent.js
import { randomUUID } from 'crypto';

export function wideEventMiddleware(logger) {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Initialize wide event
    const event = {
      timestamp: new Date().toISOString(),
      request_id: req.headers['x-request-id'] || randomUUID(),
      trace_id: req.headers['x-trace-id'],
      
      service: process.env.SERVICE_NAME || 'api',
      version: process.env.npm_package_version,
      deployment_id: process.env.DEPLOYMENT_ID,
      region: process.env.AWS_REGION,
      environment: process.env.NODE_ENV,
      
      method: req.method,
      path: req.path,
      query_params: req.query,
      user_agent: req.headers['user-agent'],
      ip_address: req.ip,
    };
    
    // Attach to request for handlers to enrich
    req.wideEvent = event;
    
    // Capture response
    const originalSend = res.send;
    res.send = function(body) {
      event.status_code = res.statusCode;
      event.outcome = res.statusCode < 400 ? 'success' : 'error';
      return originalSend.call(this, body);
    };
    
    // Capture errors
    const originalError = res.status;
    res.status = function(code) {
      if (code >= 400) {
        event.outcome = code >= 500 ? 'error' : 'client_error';
      }
      return originalError.call(this, code);
    };
    
    // Handle completion
    res.on('finish', () => {
      event.duration_ms = Date.now() - startTime;
      
      // Tail sampling decision
      const shouldLog = 
        event.status_code >= 500 ||
        event.duration_ms > 2000 ||
        event.user?.subscription === 'enterprise' ||
        Math.random() < 0.05;
      
      if (shouldLog) {
        logger.info(event);
      }
    });
    
    next();
  };
}
```

### Handler Usage

```javascript
// routes/checkout.js
import express from 'express';
const router = express.Router();

router.post('/checkout', async (req, res) => {
  const event = req.wideEvent;
  const user = req.user; // From auth middleware
  
  // Add user context
  event.user = {
    id: user.id,
    email: user.email,
    subscription: user.subscription,
    account_age_days: Math.floor(
      (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
    ),
  };
  
  try {
    // Load cart
    const cart = await getCart(user.id);
    event.cart = {
      id: cart.id,
      item_count: cart.items.length,
      total_cents: cart.total,
    };
    
    // Process payment
    const paymentStart = Date.now();
    const payment = await processPayment(cart, req.body.paymentMethod);
    
    event.payment = {
      method: req.body.paymentMethod,
      provider: 'stripe',
      latency_ms: Date.now() - paymentStart,
      amount_cents: cart.total,
    };
    
    res.json({ orderId: payment.orderId });
  } catch (error) {
    event.error = {
      type: error.name,
      code: error.code,
      message: error.message,
      retriable: error.retriable || false,
    };
    
    res.status(500).json({ error: 'Checkout failed' });
  }
});

export default router;
```

## Next.js (App Router)

### Middleware Setup

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Store in headers to access in route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-start-time', startTime.toString());
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

### API Route Handler

```typescript
// app/api/checkout/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = parseInt(request.headers.get('x-start-time') || '0');
  
  // Initialize wide event
  const event: Record<string, any> = {
    timestamp: new Date().toISOString(),
    request_id: request.headers.get('x-request-id'),
    
    service: 'nextjs-api',
    version: process.env.npm_package_version,
    region: process.env.VERCEL_REGION,
    
    method: request.method,
    path: request.nextUrl.pathname,
    user_agent: request.headers.get('user-agent'),
  };
  
  try {
    // Get user from session
    const session = await getSession();
    event.user = {
      id: session.userId,
      email: session.email,
    };
    
    // Parse request body
    const body = await request.json();
    
    // Process checkout
    const cart = await getCart(session.userId);
    event.cart = {
      id: cart.id,
      item_count: cart.items.length,
      total_cents: cart.total,
    };
    
    const payment = await processPayment(cart, body.paymentMethod);
    event.payment = {
      method: body.paymentMethod,
      provider: 'stripe',
    };
    
    event.status_code = 200;
    event.outcome = 'success';
    
    return Response.json({ orderId: payment.orderId });
    
  } catch (error: any) {
    event.status_code = 500;
    event.outcome = 'error';
    event.error = {
      type: error.name,
      code: error.code,
      message: error.message,
    };
    
    return Response.json(
      { error: 'Checkout failed' },
      { status: 500 }
    );
    
  } finally {
    event.duration_ms = Date.now() - startTime;
    console.log(JSON.stringify(event));
  }
}
```

## Flask (Python)

### Middleware Setup

```python
# middleware.py
import time
import uuid
import json
from flask import request, g
from functools import wraps

def wide_event_middleware(app):
    @app.before_request
    def before_request():
        g.start_time = time.time()
        g.wide_event = {
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'request_id': request.headers.get('X-Request-ID', str(uuid.uuid4())),
            'trace_id': request.headers.get('X-Trace-ID'),
            
            'service': app.config.get('SERVICE_NAME', 'api'),
            'version': app.config.get('VERSION', '1.0.0'),
            'region': app.config.get('REGION'),
            'environment': app.config.get('ENV', 'development'),
            
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.args),
            'user_agent': request.headers.get('User-Agent'),
            'ip_address': request.remote_addr,
        }
    
    @app.after_request
    def after_request(response):
        event = g.get('wide_event', {})
        event['status_code'] = response.status_code
        event['duration_ms'] = int((time.time() - g.start_time) * 1000)
        event['outcome'] = 'success' if response.status_code < 400 else 'error'
        
        # Tail sampling
        should_log = (
            response.status_code >= 500 or
            event['duration_ms'] > 2000 or
            event.get('user', {}).get('subscription') == 'enterprise' or
            __import__('random').random() < 0.05
        )
        
        if should_log:
            app.logger.info(json.dumps(event))
        
        return response
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        event = g.get('wide_event', {})
        event['error'] = {
            'type': type(error).__name__,
            'message': str(error),
        }
        return {'error': 'Internal server error'}, 500
```

### Route Handler

```python
# routes/checkout.py
from flask import Blueprint, request, g, jsonify

checkout_bp = Blueprint('checkout', __name__)

@checkout_bp.route('/checkout', methods=['POST'])
def checkout():
    event = g.wide_event
    user = g.current_user  # From auth middleware
    
    # Add user context
    event['user'] = {
        'id': user.id,
        'email': user.email,
        'subscription': user.subscription,
        'account_age_days': (datetime.now() - user.created_at).days,
    }
    
    try:
        # Load cart
        cart = get_cart(user.id)
        event['cart'] = {
            'id': cart.id,
            'item_count': len(cart.items),
            'total_cents': cart.total,
        }
        
        # Process payment
        payment_start = time.time()
        payment = process_payment(cart, request.json['payment_method'])
        
        event['payment'] = {
            'method': request.json['payment_method'],
            'provider': 'stripe',
            'latency_ms': int((time.time() - payment_start) * 1000),
            'amount_cents': cart.total,
        }
        
        return jsonify({'order_id': payment.order_id})
        
    except PaymentError as e:
        event['error'] = {
            'type': 'PaymentError',
            'code': e.code,
            'message': str(e),
            'retriable': e.retriable,
        }
        return jsonify({'error': 'Payment failed'}), 500
```

## FastAPI (Python)

### Middleware Setup

```python
# middleware.py
import time
import uuid
import json
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class WideEventMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Initialize wide event
        event = {
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'request_id': request.headers.get('x-request-id', str(uuid.uuid4())),
            'trace_id': request.headers.get('x-trace-id'),
            
            'service': 'fastapi-service',
            'version': '1.0.0',
            
            'method': request.method,
            'path': request.url.path,
            'query_params': dict(request.query_params),
            'user_agent': request.headers.get('user-agent'),
            'ip_address': request.client.host,
        }
        
        # Attach to request state
        request.state.wide_event = event
        
        # Process request
        response = await call_next(request)
        
        # Finalize event
        event['status_code'] = response.status_code
        event['duration_ms'] = int((time.time() - start_time) * 1000)
        event['outcome'] = 'success' if response.status_code < 400 else 'error'
        
        # Tail sampling
        should_log = (
            response.status_code >= 500 or
            event['duration_ms'] > 2000 or
            __import__('random').random() < 0.05
        )
        
        if should_log:
            print(json.dumps(event))
        
        return response
```

### Route Handler

```python
# routes/checkout.py
from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel

router = APIRouter()

class CheckoutRequest(BaseModel):
    payment_method: str

@router.post('/checkout')
async def checkout(
    checkout_req: CheckoutRequest,
    request: Request,
    user = Depends(get_current_user)
):
    event = request.state.wide_event
    
    # Add user context
    event['user'] = {
        'id': user.id,
        'email': user.email,
        'subscription': user.subscription,
    }
    
    try:
        # Load cart
        cart = await get_cart(user.id)
        event['cart'] = {
            'id': cart.id,
            'item_count': len(cart.items),
            'total_cents': cart.total,
        }
        
        # Process payment
        payment = await process_payment(cart, checkout_req.payment_method)
        event['payment'] = {
            'method': checkout_req.payment_method,
            'provider': 'stripe',
        }
        
        return {'order_id': payment.order_id}
        
    except PaymentError as e:
        event['error'] = {
            'type': 'PaymentError',
            'code': e.code,
            'message': str(e),
        }
        raise HTTPException(status_code=500, detail='Payment failed')
```

## PHP (Laravel)

### Middleware Setup

```php
<?php
// app/Http/Middleware/WideEventMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class WideEventMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);
        
        // Initialize wide event
        $event = [
            'timestamp' => now()->toIso8601String(),
            'request_id' => $request->header('X-Request-ID', (string) Str::uuid()),
            'trace_id' => $request->header('X-Trace-ID'),
            
            'service' => config('app.name'),
            'version' => config('app.version', '1.0.0'),
            'environment' => config('app.env'),
            
            'method' => $request->method(),
            'path' => $request->path(),
            'query_params' => $request->query(),
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
        ];
        
        // Store in request for controllers to access
        $request->attributes->set('wide_event', $event);
        
        // Process request
        $response = $next($request);
        
        // Finalize event
        $event['status_code'] = $response->getStatusCode();
        $event['duration_ms'] = (int) ((microtime(true) - $startTime) * 1000);
        $event['outcome'] = $response->getStatusCode() < 400 ? 'success' : 'error';
        
        // Tail sampling
        $shouldLog = 
            $response->getStatusCode() >= 500 ||
            $event['duration_ms'] > 2000 ||
            $event['user']['subscription'] ?? null === 'enterprise' ||
            mt_rand(1, 100) <= 5; // 5% sample rate
        
        if ($shouldLog) {
            Log::info(json_encode($event));
        }
        
        return $response;
    }
}
```

### Controller Usage

```php
<?php
// app/Http/Controllers/CheckoutController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\CartService;
use App\Services\PaymentService;

class CheckoutController extends Controller
{
    public function checkout(Request $request): JsonResponse
    {
        $event = $request->attributes->get('wide_event');
        $user = $request->user();
        
        // Add user context
        $event['user'] = [
            'id' => $user->id,
            'email' => $user->email,
            'subscription' => $user->subscription,
            'account_age_days' => now()->diffInDays($user->created_at),
        ];
        
        try {
            // Load cart
            $cart = app(CartService::class)->getCart($user->id);
            $event['cart'] = [
                'id' => $cart->id,
                'item_count' => $cart->items->count(),
                'total_cents' => $cart->total,
            ];
            
            // Process payment
            $paymentStart = microtime(true);
            $payment = app(PaymentService::class)->process(
                $cart,
                $request->input('payment_method')
            );
            
            $event['payment'] = [
                'method' => $request->input('payment_method'),
                'provider' => 'stripe',
                'latency_ms' => (int) ((microtime(true) - $paymentStart) * 1000),
                'amount_cents' => $cart->total,
            ];
            
            // Update event in request for middleware to log
            $request->attributes->set('wide_event', $event);
            
            return response()->json(['order_id' => $payment->order_id]);
            
        } catch (\App\Exceptions\PaymentException $e) {
            $event['error'] = [
                'type' => 'PaymentError',
                'code' => $e->getCode(),
                'message' => $e->getMessage(),
                'retriable' => $e->isRetriable(),
            ];
            
            $request->attributes->set('wide_event', $event);
            
            return response()->json(['error' => 'Payment failed'], 500);
        }
    }
}
```

### Register Middleware

```php
<?php
// app/Http/Kernel.php

protected $middleware = [
    // ... other middleware
    \App\Http\Middleware\WideEventMiddleware::class,
];
```

## PHP (Generic/Vanilla)

### Basic Implementation

```php
<?php
// middleware/WideEvent.php

class WideEventMiddleware
{
    private array $event;
    private float $startTime;
    
    public function __construct()
    {
        $this->startTime = microtime(true);
        
        $this->event = [
            'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
            'request_id' => $_SERVER['HTTP_X_REQUEST_ID'] ?? uniqid('req_', true),
            'trace_id' => $_SERVER['HTTP_X_TRACE_ID'] ?? null,
            
            'service' => getenv('SERVICE_NAME') ?: 'php-api',
            'version' => getenv('APP_VERSION') ?: '1.0.0',
            
            'method' => $_SERVER['REQUEST_METHOD'],
            'path' => parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH),
            'query_params' => $_GET,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'ip_address' => $_SERVER['REMOTE_ADDR'],
        ];
    }
    
    public function getEvent(): array
    {
        return $this->event;
    }
    
    public function addContext(string $key, $value): void
    {
        $this->event[$key] = $value;
    }
    
    public function finalize(int $statusCode): void
    {
        $this->event['status_code'] = $statusCode;
        $this->event['duration_ms'] = (int) ((microtime(true) - $this->startTime) * 1000);
        $this->event['outcome'] = $statusCode < 400 ? 'success' : 'error';
        
        // Tail sampling
        $shouldLog = 
            $statusCode >= 500 ||
            $this->event['duration_ms'] > 2000 ||
            ($this->event['user']['subscription'] ?? null) === 'enterprise' ||
            mt_rand(1, 100) <= 5;
        
        if ($shouldLog) {
            error_log(json_encode($this->event));
        }
    }
}

// index.php or bootstrap file
$wideEvent = new WideEventMiddleware();

// Make available globally
$GLOBALS['wide_event'] = $wideEvent;

// Register shutdown function to log event
register_shutdown_function(function() use ($wideEvent) {
    $statusCode = http_response_code();
    $wideEvent->finalize($statusCode);
});
```

### Handler Usage

```php
<?php
// api/checkout.php

require_once 'middleware/WideEvent.php';

$wideEvent = $GLOBALS['wide_event'];
$user = getCurrentUser(); // Your auth function

// Add user context
$wideEvent->addContext('user', [
    'id' => $user['id'],
    'email' => $user['email'],
    'subscription' => $user['subscription'],
]);

try {
    // Parse request body
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Load cart
    $cart = getCart($user['id']);
    $wideEvent->addContext('cart', [
        'id' => $cart['id'],
        'item_count' => count($cart['items']),
        'total_cents' => $cart['total'],
    ]);
    
    // Process payment
    $paymentStart = microtime(true);
    $payment = processPayment($cart, $input['payment_method']);
    
    $wideEvent->addContext('payment', [
        'method' => $input['payment_method'],
        'provider' => 'stripe',
        'latency_ms' => (int) ((microtime(true) - $paymentStart) * 1000),
    ]);
    
    http_response_code(200);
    echo json_encode(['order_id' => $payment['order_id']]);
    
} catch (PaymentException $e) {
    $wideEvent->addContext('error', [
        'type' => 'PaymentError',
        'code' => $e->getCode(),
        'message' => $e->getMessage(),
    ]);
    
    http_response_code(500);
    echo json_encode(['error' => 'Payment failed']);
}
```

## Go (net/http)

### Middleware Setup

```go
// middleware/wideevent.go
package middleware

import (
    "context"
    "encoding/json"
    "log"
    "math/rand"
    "net/http"
    "time"
    
    "github.com/google/uuid"
)

type contextKey string

const wideEventKey contextKey = "wideEvent"

type WideEvent map[string]interface{}

func WideEventMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        startTime := time.Now()
        
        // Initialize wide event
        event := WideEvent{
            "timestamp":   time.Now().UTC().Format(time.RFC3339),
            "request_id":  uuid.New().String(),
            "trace_id":    r.Header.Get("X-Trace-ID"),
            
            "service":     "go-api",
            "version":     "1.0.0",
            
            "method":      r.Method,
            "path":        r.URL.Path,
            "user_agent":  r.Header.Get("User-Agent"),
            "ip_address":  r.RemoteAddr,
        }
        
        // Add to context
        ctx := context.WithValue(r.Context(), wideEventKey, event)
        
        // Wrap response writer to capture status
        sw := &statusWriter{ResponseWriter: w, status: 200}
        
        // Process request
        next.ServeHTTP(sw, r.WithContext(ctx))
        
        // Finalize event
        event["status_code"] = sw.status
        event["duration_ms"] = time.Since(startTime).Milliseconds()
        
        if sw.status < 400 {
            event["outcome"] = "success"
        } else {
            event["outcome"] = "error"
        }
        
        // Tail sampling
        shouldLog := sw.status >= 500 ||
            time.Since(startTime).Milliseconds() > 2000 ||
            rand.Float64() < 0.05
        
        if shouldLog {
            eventJSON, _ := json.Marshal(event)
            log.Println(string(eventJSON))
        }
    })
}

type statusWriter struct {
    http.ResponseWriter
    status int
}

func (sw *statusWriter) WriteHeader(status int) {
    sw.status = status
    sw.ResponseWriter.WriteHeader(status)
}

// Helper to get event from context
func GetWideEvent(ctx context.Context) WideEvent {
    if event, ok := ctx.Value(wideEventKey).(WideEvent); ok {
        return event
    }
    return WideEvent{}
}
```

### Handler Usage

```go
// handlers/checkout.go
package handlers

import (
    "encoding/json"
    "net/http"
    "time"
    
    "yourapp/middleware"
)

type CheckoutRequest struct {
    PaymentMethod string `json:"payment_method"`
}

func CheckoutHandler(w http.ResponseWriter, r *http.Request) {
    event := middleware.GetWideEvent(r.Context())
    user := getUserFromContext(r.Context())
    
    // Add user context
    event["user"] = map[string]interface{}{
        "id":           user.ID,
        "email":        user.Email,
        "subscription": user.Subscription,
    }
    
    // Parse request
    var req CheckoutRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        event["error"] = map[string]interface{}{
            "type":    "ValidationError",
            "message": err.Error(),
        }
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }
    
    // Load cart
    cart, err := getCart(user.ID)
    if err != nil {
        event["error"] = map[string]interface{}{
            "type":    "DatabaseError",
            "message": err.Error(),
        }
        http.Error(w, "Failed to load cart", http.StatusInternalServerError)
        return
    }
    
    event["cart"] = map[string]interface{}{
        "id":         cart.ID,
        "item_count": len(cart.Items),
        "total_cents": cart.Total,
    }
    
    // Process payment
    paymentStart := time.Now()
    payment, err := processPayment(cart, req.PaymentMethod)
    
    event["payment"] = map[string]interface{}{
        "method":      req.PaymentMethod,
        "provider":    "stripe",
        "latency_ms":  time.Since(paymentStart).Milliseconds(),
    }
    
    if err != nil {
        event["error"] = map[string]interface{}{
            "type":    "PaymentError",
            "message": err.Error(),
        }
        http.Error(w, "Payment failed", http.StatusInternalServerError)
        return
    }
    
    json.NewEncoder(w).Encode(map[string]string{
        "order_id": payment.OrderID,
    })
}
```

## Rust (Axum)

### Middleware Setup

```rust
// middleware/wide_event.rs
use axum::{
    body::Body,
    extract::Request,
    middleware::Next,
    response::Response,
};
use serde_json::{json, Value};
use std::time::Instant;
use uuid::Uuid;

pub async fn wide_event_middleware(
    req: Request,
    next: Next,
) -> Response {
    let start = Instant::now();
    
    // Initialize wide event
    let mut event = json!({
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "request_id": Uuid::new_v4().to_string(),
        "trace_id": req.headers()
            .get("x-trace-id")
            .and_then(|v| v.to_str().ok()),
        
        "service": "rust-api",
        "version": env!("CARGO_PKG_VERSION"),
        
        "method": req.method().as_str(),
        "path": req.uri().path(),
        "user_agent": req.headers()
            .get("user-agent")
            .and_then(|v| v.to_str().ok()),
    });
    
    // Store in extensions
    req.extensions_mut().insert(event.clone());
    
    // Process request
    let response = next.run(req).await;
    
    // Finalize event
    let duration = start.elapsed();
    event["status_code"] = response.status().as_u16().into();
    event["duration_ms"] = duration.as_millis().into();
    event["outcome"] = if response.status().is_success() {
        "success"
    } else {
        "error"
    }.into();
    
    // Tail sampling
    let should_log = response.status().is_server_error() ||
        duration.as_millis() > 2000 ||
        rand::random::<f64>() < 0.05;
    
    if should_log {
        tracing::info!("{}", serde_json::to_string(&event).unwrap());
    }
    
    response
}
```

### Handler Usage

```rust
// handlers/checkout.rs
use axum::{
    extract::Extension,
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Deserialize)]
pub struct CheckoutRequest {
    payment_method: String,
}

#[derive(Serialize)]
pub struct CheckoutResponse {
    order_id: String,
}

pub async fn checkout_handler(
    Extension(user): Extension<User>,
    Extension(mut event): Extension<Value>,
    Json(req): Json<CheckoutRequest>,
) -> Result<Json<CheckoutResponse>, StatusCode> {
    // Add user context
    event["user"] = json!({
        "id": user.id,
        "email": user.email,
        "subscription": user.subscription,
    });
    
    // Load cart
    let cart = match get_cart(&user.id).await {
        Ok(c) => c,
        Err(e) => {
            event["error"] = json!({
                "type": "DatabaseError",
                "message": e.to_string(),
            });
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    
    event["cart"] = json!({
        "id": cart.id,
        "item_count": cart.items.len(),
        "total_cents": cart.total,
    });
    
    // Process payment
    let payment = match process_payment(&cart, &req.payment_method).await {
        Ok(p) => p,
        Err(e) => {
            event["error"] = json!({
                "type": "PaymentError",
                "code": e.code,
                "message": e.message,
            });
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    
    event["payment"] = json!({
        "method": req.payment_method,
        "provider": "stripe",
    });
    
    Ok(Json(CheckoutResponse {
        order_id: payment.order_id,
    }))
}
```

## Client-Side (React)

### Analytics Hook

```typescript
// hooks/useWideEvent.ts
import { useEffect, useRef } from 'react';

interface WideEvent {
  timestamp: string;
  event_id: string;
  action: string;
  user_id?: string;
  session_id?: string;
  page_url: string;
  page_title: string;
  referrer: string;
  viewport_width: number;
  viewport_height: number;
  [key: string]: any;
}

export function useWideEvent() {
  const sessionId = useRef(crypto.randomUUID());
  
  const trackEvent = async (action: string, context: Record<string, any> = {}) => {
    const event: WideEvent = {
      timestamp: new Date().toISOString(),
      event_id: crypto.randomUUID(),
      action,
      
      // User context
      user_id: getCurrentUserId(),
      session_id: sessionId.current,
      
      // Page context
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      
      // Device context
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      user_agent: navigator.userAgent,
      
      // Performance context
      page_load_ms: Math.round(performance.now()),
      
      // Business context (passed in)
      ...context,
    };
    
    // Send to analytics endpoint
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };
  
  return { trackEvent };
}
```

### Component Usage

```typescript
// components/CheckoutButton.tsx
import { useWideEvent } from '@/hooks/useWideEvent';

export function CheckoutButton({ cart }: { cart: Cart }) {
  const { trackEvent } = useWideEvent();
  
  const handleCheckout = async () => {
    // Track the attempt
    await trackEvent('checkout_attempted', {
      cart_value_cents: cart.total,
      item_count: cart.items.length,
      has_coupon: !!cart.couponCode,
    });
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: selectedPaymentMethod,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        
        // Track the failure
        await trackEvent('checkout_failed', {
          cart_value_cents: cart.total,
          item_count: cart.items.length,
          error_code: error.code,
          error_message: error.message,
        });
        
        return;
      }
      
      const { orderId } = await response.json();
      
      // Track success
      await trackEvent('checkout_completed', {
        cart_value_cents: cart.total,
        item_count: cart.items.length,
        order_id: orderId,
      });
      
    } catch (error) {
      await trackEvent('checkout_failed', {
        cart_value_cents: cart.total,
        error_type: 'NetworkError',
        error_message: error.message,
      });
    }
  };
  
  return (
    <button onClick={handleCheckout}>
      Complete Checkout
    </button>
  );
}
```

## Common Patterns Across All Frameworks

### 1. Initialize Early
Create the event object at the start of request processing with basic context.

### 2. Make Accessible
Store the event where handlers can access it (request state, context, extensions).

### 3. Enrich Throughout
Add context as you process: user data, business data, performance metrics.

### 4. Handle Errors
Always capture error details in the event before returning error responses.

### 5. Emit Once
Log the complete event at the end, after duration calculation.

### 6. Tail Sample
Implement intelligent sampling: always keep errors/slow requests, sample successes.

## Key Takeaways

- **Same pattern everywhere**: Initialize → Enrich → Emit
- **One event per request**: Not scattered across multiple log statements
- **Business context matters**: User subscription, cart value, payment method
- **Tail sampling is critical**: Keep costs down without losing important events
- **JSON output**: Always emit as JSON for structured querying
