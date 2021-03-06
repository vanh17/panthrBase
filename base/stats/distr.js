(function(define) {'use strict';
define(function(require) {

// Add standard distribution functions

return function(loader) {
   var utils, Variable, rgen, panthrMath;

   utils = require('../utils');
   rgen = require('rgen');
   panthrMath = require('panthrMath');

   Variable = loader.getClass('Variable');

   /**
    * Each distribution has 4 methods:
    *
    * - `r*(n, ...)` for generating random variates from that distribution
    * - `d*(x, { ..., lowerTail: true, log: false })` for the pdf
    * - `p*(x, { ..., lowerTail: true, log: false })` for the cdf
    * - `q*(p, { ..., lowerTail: true, log: false })` for the inverse cdf
    *
    * The remaining parameters are to be the same for all 4 methods, but
    * different for different distributions.
    *
    * All parameters are to be specified as a second argument to the call,
    * in the form of an `options` object.
    *
    * - `n` is to be an integer
    * - `x` and `p` are to be arrays or scalar variables
    *
    * Specific distribution parameters and their defaults:
    *
    * - unif: min = 0, max = 1
    * - norm: mu = 0, sigma = 1
    */

   //
   // UNIFORM
   //
   loader.addModuleMethod('stats', 'runif',
      makeRandom(function(opt) {
         return rgen.uniform(opt.min, opt.max);
      }, { min: 0, max: 1 })
   );
   loader.addModuleMethod('stats', 'dunif',
      makePdf(function(opt) {
         return function(val) {
            return val <= opt.max && val >= opt.min ?
                   1 / (opt.max - opt.min) :
                   0;
         };
      }, { min: 0, max: 1 })
   );
   loader.addModuleMethod('stats', 'punif',
      makeCdf(function(opt) {
         return function(val) {
            return val < opt.min ? 0 :
                   val > opt.max ? 1 :
                   (val - opt.min) / (opt.max - opt.min);
         };
      }, { min: 0, max: 1 })
   );
   loader.addModuleMethod('stats', 'qunif',
      makeInvCdf(function(opt) {
         return function(p) {
            return p <= 0 ? opt.min :
                   p >= 1 ? opt.max :
                   p * (opt.max - opt.min) + opt.min;
         };
      }, { min: 0, max: 1 })
   );

   //
   // NORMAL
   //
   loader.addModuleMethod('stats', 'rnorm',
      makeRandom(function(opt) {
         return rgen.normal(opt.mu, opt.sigma);
      }, { mu: 0, sigma: 1 })
   );
   loader.addModuleMethod('stats', 'dnorm',
      makePdf(function(opt) {
         return panthrMath.dnorm(opt.mu, opt.sigma);
      }, { mu: 0, sigma: 1 })
   );
   loader.addModuleMethod('stats', 'pnorm',
      makeCdf(function(opt) {
         return panthrMath.pnorm(opt.mu, opt.sigma);
      }, { mu: 0, sigma: 1 })
   );
   loader.addModuleMethod('stats', 'qnorm',
      makeInvCdf(function(opt) {
         return panthrMath.qnorm(opt.mu, opt.sigma);
      }, { mu: 0, sigma: 1 })
   );



   // Helper Methods

   // Standardizes the options object `opt` mixing in the distribution
   // defaults `defs` along with defaults for `lowerTail` and `log`
   function getOptions(opt, defs) {
      return utils.mixin({}, opt, defs, {
         lowerTail: true,
         log: false
      });
   }

   // Create the `r*` distribution function based on distribution defaults
   // `defs`. The function `f(opt)` returns a function that produces the
   // random deviates based on parameters `opt`.
   function makeRandom(f, defs) {
      return function(n, opt) {
         opt = getOptions(opt, defs);
         return new Variable(f(opt), { length: n });
      };
   }

   // Create the `d*` density function based on distribution defaults `defs`.
   // The function `f(val, opt)` returns the density value for `x=val` and
   // parameters `opt`.
   function makePdf(f, defs) {
      return function(x, opt) {
         var dens;
         opt = getOptions(opt, defs);
         dens = f(opt);
         return Variable.oneDimToVariable(x).map(function(val) {
            return opt.log ? Math.log(dens(val)) : dens(val);
         }, true /* skipMissing */);
      };
   }

   // Create the `p*` cdf based on distribution defaults `defs`.
   // The function `f(val, opt)` returns the cdf value for `x=val` and
   // parameters `opt`.
   function makeCdf(f, defs) {
      return function(x, opt) {
         var cdf;
         opt = getOptions(opt, defs);
         cdf = f(opt);
         return Variable.oneDimToVariable(x).map(function(val) {
            var p = opt.lowerTail ? cdf(val) : 1 - cdf(val);
            return opt.log ? Math.log(p) : p;
         }, true /* skipMissing */);
      };
   }

   // Create the `q*` inverse cdf based on distribution defaults `defs`.
   // The function `f(p, opt)` returns the percentile for `p` and
   // parameters `opt`.
   function makeInvCdf(f, defs) {
      return function(p, opt) {
         var invCdf;
         opt = getOptions(opt, defs);
         invCdf = f(opt);
         return Variable.oneDimToVariable(p).map(function(val) {
            val = opt.log ? Math.exp(val) : val;
            val = opt.lowerTail ? val : 1 - val;
            return invCdf(val);
         }, true /* skipMissing */);
      };
   }

};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
