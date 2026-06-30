"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function ProductHero({ title, description, config }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.from("[data-hero-item]", {
        y: config.enterY,
        opacity: 0,
        duration: config.duration,
        ease: "power3.out",
        stagger: 0.12,
      });
    }, rootRef);

    return () => context.revert();
  }, [config.duration, config.enterY]);

  return (
    <section className="hero" ref={rootRef}>
      <div className="hero-content">
        <p className="eyebrow" data-hero-item>UI Engineering</p>
        <h1 data-hero-item>{title}</h1>
        <p data-hero-item>{description}</p>
        <div className="actions" data-hero-item>
          <a className="button primary" href="#features">查看模块</a>
          <a className="button" href="#cms">字段配置</a>
        </div>
      </div>
      <div className="hero-visual" data-hero-item aria-label="平台界面示意">
        <div className="visual-bar" />
        <div className="visual-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}
