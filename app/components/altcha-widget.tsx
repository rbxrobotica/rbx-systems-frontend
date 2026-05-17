"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import "altcha";
import type {} from "altcha/types/react";
import type { WidgetAttributes, WidgetMethods } from "altcha/types";

interface AltchaProps {
  challengeUrl?: string;
  onStateChange?: (ev: Event | CustomEvent) => void;
}

const AltchaWidget = forwardRef<{ value: string | null }, AltchaProps>(
  ({ challengeUrl = "/api/altcha-challenge", onStateChange }, ref) => {
    const widgetRef = useRef<WidgetAttributes & WidgetMethods & HTMLElement>(null);
    const [value, setValue] = useState<string | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        get value() {
          return value;
        },
      }),
      [value]
    );

    useEffect(() => {
      const handleStateChange = (ev: Event | CustomEvent) => {
        if ("detail" in ev) {
          setValue(ev.detail.payload || null);
          onStateChange?.(ev);
        }
      };

      const { current } = widgetRef;
      if (current) {
        current.addEventListener("statechange", handleStateChange);
        return () => current.removeEventListener("statechange", handleStateChange);
      }
    }, [onStateChange]);

    return (
      <altcha-widget
        ref={widgetRef}
        challenge={challengeUrl}
      ></altcha-widget>
    );
  }
);

AltchaWidget.displayName = "AltchaWidget";

export default AltchaWidget;
