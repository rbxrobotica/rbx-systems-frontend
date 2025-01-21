// app/utils/motionsVariants.ts

import { MotionTransition } from "../interfaces/motion/motionTypes";

type MotionVariant = {
  hidden: {
    opacity: number; x?: number;
    y?: number; scale?: number
  };
  visible: {
    opacity: number; x?: number;
    y?: number; scale?: number; transition: MotionTransition
  };
};

class MotionVariants {
  static fadeInUp(): MotionVariant {
    return {
      hidden: { opacity: 0, y: 50 },
      visible: {
        opacity: 1, y: 0,
        transition: { duration: 0.4 }
      },
    };
  }

  static slideInLeft(): MotionVariant {
    return {
      hidden: { opacity: 0, x: -100 },
      visible: {
        opacity: 1, x: 0,
        transition: { duration: 0.4 }
      },
    };
  }

  static slideInRight(): MotionVariant {
    return {
      hidden: { opacity: 0, x: 100 },
      visible: {
        opacity: 1, x: 0,
        transition: { duration: 0.4 }
      },
    };
  }

  static staggerContainer(): MotionVariant {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.4,
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    };
  }

  static containerVariants(): MotionVariant {
    return {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };
  }

  static buttonVariants(): MotionVariant {
    return {
      hidden: { opacity: 0, scale: 0.8 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { delay: 0.2, duration: 0.4 },
      },
    };
  }

  static imageVariants(): MotionVariant {
    return {
      hidden: { opacity: 0, x: 100 },
      visible: { opacity: 1, x: 0, transition: { delay: 0.3, duration: 0.4 } },
    };
  }
}

export default MotionVariants;
