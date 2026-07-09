import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const potatoPositions = [
  { x: 430, y: 260, r: 36, rotate: -8, color: "#bd8950" },
  { x: 485, y: 242, r: 31, rotate: 12, color: "#d0a061" },
  { x: 535, y: 263, r: 36, rotate: 4, color: "#b97945" },
  { x: 592, y: 244, r: 30, rotate: -14, color: "#c58d52" },
  { x: 650, y: 265, r: 35, rotate: 16, color: "#d3a25e" },
  { x: 705, y: 250, r: 29, rotate: -7, color: "#b67d48" },
  { x: 462, y: 300, r: 34, rotate: 20, color: "#c99457" },
  { x: 528, y: 310, r: 39, rotate: -16, color: "#d0a066" },
  { x: 597, y: 300, r: 38, rotate: 8, color: "#bb824a" },
  { x: 668, y: 310, r: 40, rotate: -5, color: "#c99559" },
  { x: 728, y: 304, r: 35, rotate: 15, color: "#d2a466" },
];

const puddles = [
  { x: 80, y: 607, w: 220, h: 38 },
  { x: 430, y: 642, w: 260, h: 42 },
  { x: 826, y: 610, w: 300, h: 46 },
  { x: 1070, y: 670, w: 190, h: 28 },
];

const Potato = ({
  x,
  y,
  r,
  rotate,
  color,
  opacity = 1,
}: {
  x: number;
  y: number;
  r: number;
  rotate: number;
  color: string;
  opacity?: number;
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: r * 1.45,
      height: r * 1.12,
      borderRadius: "48% 54% 46% 58%",
      background: `radial-gradient(circle at 34% 30%, #e2bd7a 0 9%, transparent 10%),
        radial-gradient(circle at 68% 67%, rgba(97, 55, 32, 0.38) 0 5%, transparent 6%),
        radial-gradient(circle at 42% 74%, rgba(83, 45, 27, 0.28) 0 4%, transparent 5%),
        ${color}`,
      boxShadow:
        "inset -10px -12px 18px rgba(83, 45, 27, 0.34), inset 8px 8px 14px rgba(255, 226, 156, 0.28), 0 9px 10px rgba(61, 39, 25, 0.16)",
      opacity,
      transform: `rotate(${rotate}deg)`,
      transformOrigin: "center",
    }}
  />
);

const Cart = ({
  x,
  y,
  wheelRotation,
  bounce,
}: {
  x: number;
  y: number;
  wheelRotation: number;
  bounce: number;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bounce,
        width: 790,
        height: 320,
        transform: "rotate(-1.5deg)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 194,
          width: 360,
          height: 18,
          background: "#6f4a2d",
          borderRadius: 8,
          transform: "rotate(8deg)",
          boxShadow: "0 4px 0 #4f3422",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 22,
          top: 258,
          width: 364,
          height: 16,
          background: "#694629",
          borderRadius: 8,
          transform: "rotate(-8deg)",
          boxShadow: "0 4px 0 #4a311f",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 330,
          top: 138,
          width: 440,
          height: 140,
          background:
            "linear-gradient(90deg, #8a5b33 0 12%, #a06b3d 12% 24%, #7a4d2f 24% 27%, #a76f3f 27% 40%, #825231 40% 43%, #b17642 43% 56%, #8a5634 56% 59%, #9d6539 59% 74%, #7a4c2d 74% 77%, #a06a3d 77%)",
          border: "8px solid #5b3924",
          boxShadow:
            "inset 0 10px 0 rgba(255,255,255,0.08), inset 0 -14px 0 rgba(66, 40, 25, 0.22), 0 16px 18px rgba(58, 37, 23, 0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 355,
          top: 98,
          width: 300,
          height: 68,
          background:
            "repeating-linear-gradient(90deg, #966239 0 44px, #5b3924 44px 50px)",
          border: "7px solid #5b3924",
          boxShadow: "inset 0 -12px 0 rgba(61, 35, 21, 0.18)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 346,
          top: 274,
          width: 420,
          height: 28,
          background:
            "repeating-linear-gradient(90deg, #8e5d35 0 34px, #6f4729 34px 39px)",
          border: "6px solid #52331f",
          borderRadius: 3,
        }}
      />
      {potatoPositions.map((potato, index) => (
        <Potato
          key={index}
          x={potato.x}
          y={potato.y - 120}
          r={potato.r}
          rotate={potato.rotate}
          color={potato.color}
          opacity={index === 8 ? 0 : 1}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 575,
          top: 202,
          width: 168,
          height: 168,
          borderRadius: "50%",
          border: "13px solid #5b3924",
          background:
            "radial-gradient(circle, #c18a51 0 10%, #5b3924 11% 15%, transparent 16%)",
          boxShadow:
            "inset 0 0 0 10px #8b5a35, 0 14px 18px rgba(53, 33, 22, 0.34)",
          transform: `rotate(${wheelRotation}deg)`,
        }}
      >
        {Array.from({ length: 14 }).map((_, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: 75,
              top: 9,
              width: 6,
              height: 142,
              background: "#6d462c",
              transformOrigin: "3px 75px",
              transform: `rotate(${(360 / 14) * index}deg)`,
              borderRadius: 4,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 713,
          top: 170,
          width: 80,
          height: 18,
          background: "#674225",
          borderRadius: 9,
          boxShadow: "0 4px 0 #4b301d",
        }}
      />
    </div>
  );
};

const Puller = ({
  x,
  y,
  step,
}: {
  x: number;
  y: number;
  step: number;
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: 180, height: 230 }}>
    <div
      style={{
        position: "absolute",
        left: 88,
        top: 8,
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "#5a3524",
        boxShadow: "inset 9px 0 0 rgba(255, 218, 172, 0.18)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 56,
        top: 60,
        width: 78,
        height: 96,
        borderRadius: "26px 30px 20px 18px",
        background: "linear-gradient(135deg, #37515a, #182c32)",
        transform: "rotate(11deg)",
        boxShadow: "inset -10px -8px 0 rgba(0,0,0,0.18)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 104,
        top: 84,
        width: 102,
        height: 18,
        borderRadius: 9,
        background: "#4a2d20",
        transform: "rotate(18deg)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 44,
        top: 138,
        width: 22,
        height: 92,
        borderRadius: 12,
        background: "#3f2a23",
        transformOrigin: "50% 0",
        transform: `rotate(${lerp(-12, 16, step)}deg)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 92,
        top: 138,
        width: 22,
        height: 96,
        borderRadius: 12,
        background: "#4b3026",
        transformOrigin: "50% 0",
        transform: `rotate(${lerp(16, -13, step)}deg)`,
      }}
    />
  </div>
);

const SpiritPotato = ({
  x,
  y,
  scale,
  walk,
  speak,
}: {
  x: number;
  y: number;
  scale: number;
  walk: number;
  speak: number;
}) => {
  const legSwing = Math.sin(walk * Math.PI * 2) * 16;
  const armSwing = Math.sin(walk * Math.PI * 2 + Math.PI) * 12;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 180,
        height: 230,
        transform: `scale(${scale})`,
        transformOrigin: "50% 100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 34,
          top: 26,
          width: 116,
          height: 132,
          borderRadius: "48% 56% 50% 44%",
          background:
            "radial-gradient(circle at 31% 30%, #f0c777 0 7%, transparent 8%), radial-gradient(circle at 73% 70%, rgba(81, 45, 28, 0.32) 0 5%, transparent 6%), #c99255",
          boxShadow:
            "inset -16px -18px 22px rgba(76, 45, 29, 0.34), inset 12px 10px 18px rgba(255, 224, 146, 0.35), 0 18px 18px rgba(55, 36, 24, 0.2)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 43,
            width: 15,
            height: 19,
            borderRadius: "50%",
            background: "#2d2019",
            boxShadow: "48px 2px 0 #2d2019",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 78,
            width: 34,
            height: 15 + speak * 9,
            borderRadius: "0 0 24px 24px",
            borderBottom: "5px solid #2d2019",
            background: speak > 0.5 ? "#5b2d28" : "transparent",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 28,
          top: 91,
          width: 42,
          height: 12,
          borderRadius: 8,
          background: "#5d3927",
          transformOrigin: "100% 50%",
          transform: `rotate(${24 + armSwing}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 122,
          top: 92,
          width: 44,
          height: 12,
          borderRadius: 8,
          background: "#5d3927",
          transformOrigin: "0 50%",
          transform: `rotate(${-22 - armSwing}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 63,
          top: 148,
          width: 18,
          height: 72,
          borderRadius: 10,
          background: "#5a3524",
          transformOrigin: "50% 0",
          transform: `rotate(${legSwing}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 103,
          top: 148,
          width: 18,
          height: 72,
          borderRadius: 10,
          background: "#5a3524",
          transformOrigin: "50% 0",
          transform: `rotate(${-legSwing}deg)`,
        }}
      />
    </div>
  );
};

export const MyComposition = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const travel = interpolate(frame, [0, 9.6 * fps], [-210, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wheelRotation = frame * 8.5;
  const cartBounce = Math.sin(frame / 5) * 3 + Math.sin(frame / 13) * 2;
  const pullerStep = (Math.sin(frame / 5) + 1) / 2;

  const dropStart = 3.1 * fps;
  const dropEnd = 5.0 * fps;
  const dropProgress = clamp01((frame - dropStart) / (dropEnd - dropStart));
  const fallEase = interpolate(dropProgress, [0, 1], [0, 1], {
    easing: Easing.bezier(0.2, 0.86, 0.22, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const potatoX = lerp(575 + travel, 690, fallEase);
  const arc = Math.sin(fallEase * Math.PI) * 145;
  const potatoY = lerp(284 + cartBounce, 494, fallEase) - arc;
  const potatoRotate = lerp(-8, 390, fallEase);
  const magic = interpolate(frame, [5.0 * fps, 6.1 * fps], [0, 1], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spiritWalk = clamp01((frame - 6.15 * fps) / (2.4 * fps));
  const spiritX = lerp(660, 760, spiritWalk);
  const speech = interpolate(frame, [7.0 * fps, 7.45 * fps], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background:
          "linear-gradient(#d8d0bd 0 18%, #a9a88e 18% 43%, #6a583d 43% 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.32), transparent 16%), radial-gradient(circle at 82% 18%, rgba(255,236,190,0.28), transparent 18%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -120,
          right: -120,
          bottom: -30,
          height: 330,
          background:
            "linear-gradient(176deg, #705436 0%, #4b3325 62%, #38251d 100%)",
          transform: "skewY(-3deg)",
          boxShadow: "inset 0 36px 54px rgba(33, 23, 17, 0.25)",
        }}
      />
      {Array.from({ length: 34 }).map((_, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: (index * 137 + (frame * 2.4) % 137) % 1420 - 100,
            top: 468 + ((index * 41) % 210),
            width: 70 + ((index * 29) % 90),
            height: 8 + ((index * 13) % 12),
            borderRadius: "50%",
            background:
              index % 3 === 0
                ? "rgba(43, 31, 23, 0.2)"
                : "rgba(151, 111, 69, 0.28)",
            transform: `rotate(${index % 2 === 0 ? -7 : 5}deg)`,
          }}
        />
      ))}
      {puddles.map((puddle, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: puddle.x,
            top: puddle.y,
            width: puddle.w,
            height: puddle.h,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 50% 42%, rgba(104, 80, 55, 0.98), rgba(42, 31, 24, 0.82) 70%)",
            boxShadow: "inset 0 6px 10px rgba(221, 180, 115, 0.25)",
            opacity: 0.86,
          }}
        />
      ))}
      <Puller x={travel - 35} y={305 + cartBounce * 0.5} step={pullerStep} />
      <Cart x={travel} y={185} wheelRotation={wheelRotation} bounce={cartBounce} />
      <div
        style={{
          position: "absolute",
          left: 515 + travel,
          top: 556 + cartBounce,
          width: 230,
          height: 26,
          borderRadius: "50%",
          background: "rgba(48, 31, 22, 0.32)",
          filter: "blur(2px)",
        }}
      />
      {frame < 5.0 * fps && (
        <Potato
          x={potatoX}
          y={potatoY}
          r={54}
          rotate={potatoRotate}
          color="#c58c51"
        />
      )}
      <div
        style={{
          position: "absolute",
          left: 658,
          top: 594,
          width: 145,
          height: 24,
          borderRadius: "50%",
          background: `rgba(44, 29, 21, ${0.18 + magic * 0.16})`,
          transform: `scale(${0.7 + magic * 0.55})`,
          opacity: magic,
        }}
      />
      {magic > 0 && (
        <SpiritPotato
          x={spiritX}
          y={386 - Math.sin(spiritWalk * Math.PI * 6) * 5}
          scale={magic}
          walk={spiritWalk * 3}
          speak={speech}
        />
      )}
      {magic > 0 && (
        <>
          {Array.from({ length: 10 }).map((_, index) => {
            const angle = (Math.PI * 2 * index) / 10 + frame / 22;
            const radius = 72 + magic * 30;
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: 720 + Math.cos(angle) * radius,
                  top: 475 + Math.sin(angle) * radius,
                  width: 8 + (index % 3) * 3,
                  height: 8 + (index % 3) * 3,
                  borderRadius: "50%",
                  background: index % 2 === 0 ? "#f6dd7b" : "#8fe3bd",
                  opacity: magic * 0.9,
                  boxShadow: "0 0 18px rgba(246, 221, 123, 0.72)",
                }}
              />
            );
          })}
        </>
      )}
      <div
        style={{
          position: "absolute",
          left: 840,
          top: 258,
          width: 285,
          minHeight: 112,
          padding: "22px 28px",
          borderRadius: 28,
          background: "rgba(255, 245, 220, 0.94)",
          border: "6px solid #5a3825",
          color: "#3d2a1f",
          fontSize: 34,
          fontWeight: 800,
          lineHeight: 1.15,
          transform: `translateY(${interpolate(speech, [0, 1], [16, 0])}px) scale(${speech})`,
          transformOrigin: "20% 100%",
          opacity: speech,
          boxShadow: "0 18px 26px rgba(43, 28, 20, 0.18)",
        }}
      >
        嘿！我会走路啦！
        <div
          style={{
            position: "absolute",
            left: 34,
            bottom: -26,
            width: 46,
            height: 46,
            background: "rgba(255, 245, 220, 0.94)",
            borderRight: "6px solid #5a3825",
            borderBottom: "6px solid #5a3825",
            transform: "rotate(45deg)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 44,
          top: 44,
          padding: "12px 18px",
          borderRadius: 8,
          background: "rgba(44, 31, 24, 0.58)",
          color: "#f7ead1",
          fontSize: 22,
          letterSpacing: 0,
          fontWeight: 700,
        }}
      >
        泥路板车奇遇
      </div>
    </AbsoluteFill>
  );
};
