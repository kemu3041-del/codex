import ProductHero from "../components/ProductHero";
import ScrollFeature from "../components/ScrollFeature";
import { animationConfig, features } from "../lib/animation-config";

export default function HomePage() {
  return (
    <main>
      <ProductHero
        title="Nova CMS 可视化内容平台"
        description="面向内容运营和前端交付的组件化展示页，支持字段替换、模块复用和动效增强。"
        config={animationConfig}
      />
      <section className="feature-list">
        {features.map((feature, index) => (
          <ScrollFeature key={feature.title} feature={feature} index={index} />
        ))}
      </section>
    </main>
  );
}
