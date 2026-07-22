# Wide Event Field Reference

Complete catalog of fields to include in your wide events, organized by category. Include all fields that might be useful for debugging - storage is cheap, missing context is expensive.

## Request Context (Always Include)

### Core Request Fields
- `request_id` (string, required): Unique identifier for this request. Use UUIDs or similar.
- `trace_id` (string): Distributed tracing ID that follows the request across services.
- `timestamp` (ISO 8601 string, required): When the request started. Use `new Date().toISOString()`.
- `method` (string, required): HTTP method - GET, POST, PUT, DELETE, etc.
- `path` (string, required): Request path - `/api/v1/checkout`.
- `status_code` (integer, required): HTTP status code - 200, 400, 500, etc.
- `duration_ms` (integer, required): Total request duration in milliseconds.

### Optional Request Fields
- `query_params` (object): URL query parameters as key-value pairs.
- `user_agent` (string): Client user agent string.
- `ip_address` (string): Client IP address (anonymize if needed for privacy).
- `referer` (string): HTTP referer header.
- `correlation_id` (string): ID linking related requests (e.g., webhook callbacks).
- `idempotency_key` (string): For idempotent operations.

## Infrastructure Context (Always Include)

### Service Identification
- `service` (string, required): Service name - `checkout-service`, `api-gateway`.
- `version` (string, required): Service version - `2.4.1`, `v1.0.0`.
- `deployment_id` (string): Unique deployment identifier - helps correlate errors with deploys.
- `region` (string): Geographic region - `us-east-1`, `eu-west-2`.
- `environment` (string): Environment name - `production`, `staging`, `development`.
- `hostname` (string): Server hostname or container ID.
- `instance_id` (string): Cloud instance ID if applicable.

### Resource Usage (Optional but valuable)
- `memory_usage_mb` (integer): Memory usage in megabytes.
- `cpu_percent` (float): CPU utilization percentage.
- `active_connections` (integer): Number of active connections to this service.

## User Context (Critical for Debugging)

### User Identification
- `user_id` (string): User's unique identifier. High cardinality = high value.
- `session_id` (string): Current session identifier.
- `email` (string): User email (hash for privacy if needed).
- `username` (string): User's display name or username.
- `ip_address` (string): User's IP address.

### User Characteristics
- `subscription` (string): Subscription tier - `free`, `premium`, `enterprise`.
- `account_age_days` (integer): Days since account creation.
- `lifetime_value_cents` (integer): Total revenue from this user.
- `is_internal` (boolean): Is this an internal/test user?
- `feature_flags` (object): Feature flags enabled for this user.
- `ab_test_variants` (object): A/B test variants assigned to this user.
- `locale` (string): User's locale - `en-US`, `fr-FR`.
- `timezone` (string): User's timezone - `America/New_York`.

## Business Context (What Happened)

### Checkout/Payment
- `cart.id` (string): Shopping cart identifier.
- `cart.item_count` (integer): Number of items in cart.
- `cart.total_cents` (integer): Cart total in cents (avoid floats for money).
- `cart.coupon_code` (string): Applied coupon code if any.
- `order.id` (string): Order identifier after successful checkout.
- `payment.method` (string): Payment method - `card`, `paypal`, `bank_transfer`.
- `payment.provider` (string): Payment provider - `stripe`, `braintree`.
- `payment.latency_ms` (integer): Time spent calling payment provider.
- `payment.attempt` (integer): Payment attempt number (for retries).
- `payment.amount_cents` (integer): Payment amount in cents.

### Content/Media
- `article.id` (string): Article or content identifier.
- `upload.size_bytes` (integer): File upload size.
- `upload.mime_type` (string): File MIME type.
- `video.duration_seconds` (integer): Video duration.
- `image.width` (integer): Image width in pixels.
- `image.height` (integer): Image height in pixels.

### Search/Discovery
- `search.query` (string): Search query string.
- `search.results_count` (integer): Number of results returned.
- `search.result_clicked` (string): Which result was clicked (position or ID).
- `recommendation.algorithm` (string): Recommendation algorithm used.
- `recommendation.shown_count` (integer): Number of recommendations shown.

## Error Context (When Things Go Wrong)

### Error Details
- `error.type` (string): Error class/type - `PaymentError`, `ValidationError`.
- `error.code` (string): Application error code - `card_declined`, `insufficient_funds`.
- `error.message` (string): Human-readable error message.
- `error.retriable` (boolean): Can this error be retried?
- `error.stack` (string): Stack trace (development only, sanitize for production).

### Provider-Specific Errors
- `error.stripe_code` (string): Stripe-specific error code.
- `error.stripe_decline_code` (string): Card decline reason from Stripe.
- `error.aws_error_code` (string): AWS service error code.
- `error.http_status` (integer): Upstream HTTP status if error came from external API.

### Context When Error Occurred
- `error.user_input` (object): Sanitized user input that triggered the error.
- `error.state` (object): Application state when error occurred (sanitize sensitive data).
- `error.related_ids` (array): Related entity IDs for debugging.

## Performance Context

### Timing Breakdown
- `duration_ms` (integer, required): Total request duration.
- `db.query_count` (integer): Number of database queries executed.
- `db.total_duration_ms` (integer): Total time spent in database queries.
- `db.slowest_query_ms` (integer): Duration of slowest query.
- `cache.hit_count` (integer): Number of cache hits.
- `cache.miss_count` (integer): Number of cache misses.
- `cache.lookup_ms` (integer): Time spent in cache lookups.
- `external_api.call_count` (integer): Number of external API calls.
- `external_api.total_duration_ms` (integer): Total time in external calls.

### Database Details
- `db.queries` (array): List of executed queries (with sanitized params).
- `db.connection_pool_size` (integer): Connection pool size.
- `db.active_connections` (integer): Active database connections.
- `db.waiting_requests` (integer): Requests waiting for database connection.

### External Dependencies
- `redis.latency_ms` (integer): Redis operation latency.
- `s3.upload_duration_ms` (integer): S3 upload duration.
- `s3.bucket` (string): S3 bucket name.
- `s3.key` (string): S3 object key.
- `webhook.delivery_latency_ms` (integer): Webhook delivery time.
- `webhook.recipient_url` (string): Webhook destination URL.

## Client-Side Specific Fields

### Page/View Context
- `page.url` (string): Current page URL.
- `page.title` (string): Page title.
- `page.referrer` (string): Referrer URL.
- `page.load_time_ms` (integer): Page load time.
- `navigation.type` (string): Navigation type - `navigation`, `reload`, `back_forward`.

### Device/Browser
- `device.type` (string): Device type - `desktop`, `mobile`, `tablet`.
- `device.os` (string): Operating system - `iOS`, `Android`, `Windows`.
- `device.browser` (string): Browser name - `Chrome`, `Safari`, `Firefox`.
- `device.browser_version` (string): Browser version.
- `viewport.width` (integer): Viewport width in pixels.
- `viewport.height` (integer): Viewport height in pixels.
- `connection.type` (string): Connection type - `4g`, `wifi`, `slow-2g`.
- `connection.downlink_mbps` (float): Estimated downlink speed.

### User Interaction
- `interaction.type` (string): Type of interaction - `click`, `submit`, `scroll`.
- `interaction.target` (string): CSS selector or element identifier.
- `interaction.time_on_page_ms` (integer): Time spent on page before interaction.
- `form.field_count` (integer): Number of form fields.
- `form.validation_errors` (array): Validation errors encountered.

## Feature Rollout Context

### Feature Flags
- `feature_flags` (object): Map of feature flag names to boolean values.
  ```json
  {
    "new_checkout_flow": true,
    "express_payment": false,
    "ai_recommendations": true
  }
  ```

### Experiments
- `experiments` (object): Active A/B tests and variants.
  ```json
  {
    "checkout_button_color": "blue",
    "pricing_page_layout": "variant_b"
  }
  ```

## Security Context (Optional)

### Authentication
- `auth.method` (string): Authentication method - `jwt`, `oauth`, `api_key`.
- `auth.provider` (string): Auth provider - `auth0`, `okta`, `google`.
- `auth.scope` (array): OAuth scopes granted.
- `auth.token_age_seconds` (integer): Age of authentication token.

### Security Events
- `security.rate_limit_remaining` (integer): Rate limit remaining for this user.
- `security.suspicious_activity` (boolean): Flag for suspicious patterns.
- `security.bot_score` (float): Bot detection score (0-1).

## Field Naming Conventions

### General Rules
- Use snake_case for all field names: `user_id`, not `userId` or `UserID`
- Use consistent suffixes:
  - `_id` for identifiers: `user_id`, `order_id`
  - `_ms` for milliseconds: `duration_ms`, `latency_ms`
  - `_cents` for money: `amount_cents`, `total_cents`
  - `_count` for counts: `item_count`, `retry_count`
  - `_at` for timestamps: `created_at`, `expires_at`

### Namespacing
Use dot notation for nested context:
- `user.id`, `user.subscription`, `user.account_age_days`
- `cart.id`, `cart.item_count`, `cart.total_cents`
- `error.type`, `error.code`, `error.message`

This keeps events flat in JSON but logically organized:
```json
{
  "user.id": "user_123",
  "user.subscription": "premium",
  "cart.id": "cart_xyz",
  "cart.total_cents": 15999
}
```

## Cardinality Guide

**High cardinality** (millions of unique values) = Most valuable for debugging:
- `user_id`, `email`, `session_id`
- `request_id`, `trace_id`, `order_id`
- `ip_address`, `device_id`

**Medium cardinality** (hundreds to thousands):
- `user_agent`, `referer`
- `error_code`, `error_message`
- `product_id`, `sku`

**Low cardinality** (few unique values) = Good for grouping/aggregation:
- `method`, `status_code`
- `subscription`, `region`
- `device_type`, `browser`

## How Many Fields Should I Include?

**Minimum viable**: 15-20 fields covering request, user, and outcome.

**Good target**: 30-50 fields with business context.

**Comprehensive**: 50+ fields including performance and security.

**Rule of thumb**: If you might ask "what was the X when this happened?", include X in your wide event. Storage is cheap. Missing context during an outage is expensive.

## Example Complete Wide Event

```json
{
  "timestamp": "2024-12-20T10:23:45.612Z",
  "request_id": "req_8bf7ec2d",
  "trace_id": "abc123def456",
  
  "service": "checkout-service",
  "version": "2.4.1",
  "deployment_id": "deploy_789",
  "region": "us-east-1",
  "environment": "production",
  
  "method": "POST",
  "path": "/api/checkout",
  "status_code": 500,
  "duration_ms": 1247,
  
  "user.id": "user_456",
  "user.email": "user@example.com",
  "user.subscription": "premium",
  "user.account_age_days": 847,
  "user.lifetime_value_cents": 284700,
  
  "cart.id": "cart_xyz",
  "cart.item_count": 3,
  "cart.total_cents": 15999,
  "cart.coupon_code": "SAVE20",
  
  "payment.method": "card",
  "payment.provider": "stripe",
  "payment.amount_cents": 15999,
  "payment.latency_ms": 1089,
  "payment.attempt": 3,
  
  "error.type": "PaymentError",
  "error.code": "card_declined",
  "error.message": "Card declined by issuer",
  "error.retriable": false,
  "error.stripe_decline_code": "insufficient_funds",
  
  "db.query_count": 3,
  "db.total_duration_ms": 145,
  "cache.hit_count": 2,
  "cache.miss_count": 1,
  "external_api.call_count": 1,
  "external_api.total_duration_ms": 1089,
  
  "feature_flags.new_checkout_flow": true,
  "feature_flags.express_payment": false,
  
  "experiments.checkout_button_color": "blue"
}
```

This event has 42 fields and can answer almost any debugging question you might have about this failed checkout.
