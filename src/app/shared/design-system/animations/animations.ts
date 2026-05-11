import { 
  trigger, 
  state, 
  style, 
  animate, 
  transition, 
  keyframes,
  query
} from '@angular/animations';

// Fade animations
export const fadeInUp = trigger('fadeInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(30px)' }),
    animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const fadeInLeft = trigger('fadeInLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-30px)' }),
    animate('600ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

export const fadeInRight = trigger('fadeInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(30px)' }),
    animate('600ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.9)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

export const pulse = trigger('pulse', [
  transition(':enter', [
    animate('2s ease-in-out', keyframes([
      style({ transform: 'scale(1)' }),
      style({ transform: 'scale(1.05)' }),
      style({ transform: 'scale(1)' })
    ]))
  ])
]);

export const shimmer = trigger('shimmer', [
  transition(':enter', [
    animate('1.5s ease-in-out', keyframes([
      style({ backgroundPosition: '-200% 0' }),
      style({ backgroundPosition: '200% 0' })
    ]))
  ])
]);

export const slideInFromTop = trigger('slideInFromTop', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-100%)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const bounceIn = trigger('bounceIn', [
  transition(':enter', [
    animate('600ms ease-out', keyframes([
      style({ transform: 'scale(0.3)' }),
      style({ transform: 'scale(1.05)' }),
      style({ transform: 'scale(0.9)' }),
      style({ transform: 'scale(1)' })
    ]))
  ])
]);

export const glowPulse = trigger('glowPulse', [
  transition(':enter', [
    animate('2s ease-in-out', keyframes([
      style({ 
        boxShadow: '0 0 0 rgba(0, 194, 255, 0.4)',
        borderColor: 'rgba(0, 194, 255, 0.3)'
      }),
      style({ 
        boxShadow: '0 0 20px rgba(0, 194, 255, 0.8)',
        borderColor: 'rgba(0, 194, 255, 0.6)'
      }),
      style({ 
        boxShadow: '0 0 0 rgba(0, 194, 255, 0.4)',
        borderColor: 'rgba(0, 194, 255, 0.3)'
      })
    ]))
  ])
]);

export const rotateIn = trigger('rotateIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'rotate(-180deg)' }),
    animate('600ms ease-out', style({ opacity: 1, transform: 'rotate(0deg)' }))
  ])
]);

export const staggerAnimation = trigger('staggerAnimation', [
  transition(':enter', [
    query('.stagger-item', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ], { optional: true })
  ])
]);

export const glassShimmer = trigger('glassShimmer', [
  transition(':enter', [
    animate('1.5s ease-in-out', keyframes([
      style({ 
        backgroundPosition: '-200% 0',
        opacity: 0.8
      }),
      style({ 
        backgroundPosition: '200% 0',
        opacity: 1
      })
    ]))
  ])
]);

export const neonGlow = trigger('neonGlow', [
  transition(':enter', [
    animate('3s ease-in-out', keyframes([
      style({ 
        boxShadow: '0 0 5px rgba(0, 194, 255, 0.2)',
        borderColor: 'rgba(0, 194, 255, 0.2)'
      }),
      style({ 
        boxShadow: '0 0 15px rgba(0, 194, 255, 0.6)',
        borderColor: 'rgba(0, 194, 255, 0.6)'
      }),
      style({ 
        boxShadow: '0 0 5px rgba(0, 194, 255, 0.2)',
        borderColor: 'rgba(0, 194, 255, 0.2)'
      })
    ]))
  ])
]);

export const floatAnimation = trigger('floatAnimation', [
  transition(':enter', [
    animate('3s ease-in-out', keyframes([
      style({ transform: 'translateY(0px)' }),
      style({ transform: 'translateY(-10px)' }),
      style({ transform: 'translateY(0px)' })
    ]))
  ])
]);

// Utility functions for applying animations dynamically
export const getRandomDelay = (min: number = 0, max: number = 500): number => {
  return Math.random() * (max - min) + min;
};

export const getStaggerDelay = (index: number, baseDelay: number = 100): number => {
  return index * baseDelay;
};

export const getEasingFunction = (type: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' = 'ease-out'): string => {
  const easingMap = {
    'ease': '0.25 0.1 0.25 1',
    'ease-in': '0.42 0 1 1',
    'ease-out': '0 0 0.58 1',
    'ease-in-out': '0.42 0 0.58 1'
  };
  return easingMap[type];
};

// Animation presets for different use cases
export const animationPresets = {
  // Page transitions
  pageTransition: fadeInUp,
  // Card animations
  cardEntry: scaleIn,
  cardHover: pulse,
  // List animations
  listEntry: fadeInLeft,
  listStagger: staggerAnimation,
  // Button animations
  buttonHover: glowPulse,
  buttonClick: bounceIn,
  // Loading animations
  loadingShimmer: shimmer,
  glassLoading: glassShimmer,
  // Modal animations
  modalEntry: fadeInUp,
  modalBackdrop: fadeInUp,
  // Navigation animations
  navSlideIn: slideInFromTop,
  navItemHover: neonGlow,
  // Special effects
  floatingElement: floatAnimation,
  rotatingIcon: rotateIn
};
