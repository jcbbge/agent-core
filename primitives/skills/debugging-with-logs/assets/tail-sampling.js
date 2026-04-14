/**
 * Tail Sampling Decision Function
 * 
 * Intelligently decide whether to keep an event based on its characteristics.
 * This keeps costs manageable while ensuring critical events are never lost.
 * 
 * Philosophy:
 * - Always keep: Errors, slow requests, VIP users, debugging scenarios
 * - Sometimes keep: Successful, fast requests at a low sample rate
 * 
 * Customize the thresholds based on your application's needs.
 */

/**
 * Decides whether to emit/store this wide event
 * 
 * @param {Object} event - The wide event object
 * @param {Object} options - Sampling configuration
 * @returns {boolean} - True if event should be kept, false otherwise
 */
function shouldSample(event, options = {}) {
  // Default configuration (customize for your needs)
  const config = {
    // Performance thresholds
    slowRequestThresholdMs: options.slowRequestThresholdMs || 2000,
    
    // Error sampling
    alwaysKeepServerErrors: options.alwaysKeepServerErrors !== false,
    alwaysKeepClientErrors: options.alwaysKeepClientErrors || false,
    
    // User-based sampling
    vipSubscriptionTiers: options.vipSubscriptionTiers || ['enterprise', 'premium'],
    alwaysKeepInternalUsers: options.alwaysKeepInternalUsers !== false,
    
    // Feature flag sampling (for debugging rollouts)
    debugFeatureFlags: options.debugFeatureFlags || [],
    
    // Base sample rate for successful requests
    baseSampleRate: options.baseSampleRate || 0.05, // 5%
    
    // Minimum sample rate (even for successful fast requests)
    minimumSampleRate: options.minimumSampleRate || 0.01, // 1%
  };
  
  // ===== ALWAYS KEEP =====
  
  // 1. Server errors (5xx)
  if (config.alwaysKeepServerErrors && event.status_code >= 500) {
    return true;
  }
  
  // 2. Client errors (4xx) if configured
  if (config.alwaysKeepClientErrors && event.status_code >= 400 && event.status_code < 500) {
    return true;
  }
  
  // 3. Any request with an error object
  if (event.error) {
    return true;
  }
  
  // 4. Slow requests (above performance threshold)
  if (event.duration_ms > config.slowRequestThresholdMs) {
    return true;
  }
  
  // 5. VIP users (high-value customers)
  if (event.user?.subscription && config.vipSubscriptionTiers.includes(event.user.subscription)) {
    return true;
  }
  
  // 6. Internal/test users (for debugging)
  if (config.alwaysKeepInternalUsers && event.user?.is_internal) {
    return true;
  }
  
  // 7. Requests with specific feature flags enabled (debugging rollouts)
  if (config.debugFeatureFlags.length > 0 && event.feature_flags) {
    for (const flag of config.debugFeatureFlags) {
      if (event.feature_flags[flag] === true) {
        return true;
      }
    }
  }
  
  // 8. Specific experiment variants (if tracking specific variant performance)
  if (options.debugExperiments && event.experiments) {
    for (const [experiment, variant] of Object.entries(options.debugExperiments)) {
      if (event.experiments[experiment] === variant) {
        return true;
      }
    }
  }
  
  // ===== CONDITIONAL KEEP =====
  
  // 9. High-value transactions (business-specific)
  if (options.highValueThresholdCents && event.cart?.total_cents > options.highValueThresholdCents) {
    return true;
  }
  
  // 10. Specific paths that need higher sampling
  if (options.highSamplePaths && options.highSamplePaths.some(path => event.path?.includes(path))) {
    // Use higher sample rate for these paths
    return Math.random() < (options.pathSampleRate || 0.2);
  }
  
  // ===== BASE SAMPLING =====
  
  // For successful, fast requests: random sample at base rate
  if (event.status_code < 400 && event.duration_ms <= config.slowRequestThresholdMs) {
    return Math.random() < config.baseSampleRate;
  }
  
  // Fallback: minimum sampling for everything else
  return Math.random() < config.minimumSampleRate;
}

/**
 * Example usage in middleware:
 */
function exampleMiddleware() {
  return async (ctx, next) => {
    const event = ctx.get('wideEvent');
    
    try {
      await next();
    } finally {
      // Tail sampling decision
      const shouldKeep = shouldSample(event, {
        slowRequestThresholdMs: 1500,
        vipSubscriptionTiers: ['enterprise', 'premium', 'team'],
        debugFeatureFlags: ['new_checkout_flow', 'express_payment'],
        baseSampleRate: 0.05, // 5% of successful requests
        highValueThresholdCents: 50000, // $500+
      });
      
      if (shouldKeep) {
        console.log(JSON.stringify(event));
      }
    }
  };
}

/**
 * Advanced: Dynamic sampling based on error rate
 * 
 * If you're seeing high error rates, temporarily increase sampling
 * to capture more context. This requires maintaining error rate metrics.
 */
function adaptiveShouldSample(event, recentErrorRate = 0.01) {
  // If error rate is high, increase sampling of successful requests
  // to better understand what's working vs what's not
  
  const baseConfig = {
    slowRequestThresholdMs: 2000,
    vipSubscriptionTiers: ['enterprise'],
    baseSampleRate: 0.05,
  };
  
  // If error rate > 5%, increase sampling to 20%
  if (recentErrorRate > 0.05) {
    baseConfig.baseSampleRate = 0.2;
  }
  // If error rate > 10%, sample everything
  else if (recentErrorRate > 0.1) {
    baseConfig.baseSampleRate = 1.0;
  }
  
  return shouldSample(event, baseConfig);
}

/**
 * Environment-specific sampling
 * 
 * Different sampling strategies for different environments
 */
function environmentAwareSampling(event, environment) {
  let config;
  
  switch (environment) {
    case 'production':
      config = {
        baseSampleRate: 0.05, // 5% in production
        slowRequestThresholdMs: 2000,
      };
      break;
      
    case 'staging':
      config = {
        baseSampleRate: 0.5, // 50% in staging
        slowRequestThresholdMs: 3000,
      };
      break;
      
    case 'development':
      config = {
        baseSampleRate: 1.0, // 100% in development
        alwaysKeepClientErrors: true,
      };
      break;
      
    default:
      config = { baseSampleRate: 0.1 };
  }
  
  return shouldSample(event, config);
}

// Export for use in your application
module.exports = {
  shouldSample,
  adaptiveShouldSample,
  environmentAwareSampling,
};

/**
 * Expected outcomes with these settings:
 * 
 * At 10,000 requests/second with typical distribution:
 * - 8,500 successful fast requests → 425 kept (5%)
 * - 1,000 slow requests → 1,000 kept (100%)
 * - 500 errors → 500 kept (100%)
 * 
 * Total: ~2,000 events/second instead of 10,000 (80% reduction)
 * 
 * But you NEVER lose:
 * - Any error or failure
 * - Any slow request
 * - Any VIP user interaction
 * - Any request with debugging flags enabled
 * 
 * This is the power of tail sampling.
 */
