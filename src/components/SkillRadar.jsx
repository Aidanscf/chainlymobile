import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Polygon,
  Text as SvgText,
} from "react-native-svg";
import { colors, typography } from "../theme/index";

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

export default function SkillRadar({
  skills,
  size = 240,
  levels = 4,
  stroke = colors.primary,
  fill = colors.primarySoft2,
}) {
  const data = skills || [];

  const computed = useMemo(() => {
    const count = data.length;
    const center = size / 2;
    const maxR = size * 0.34;

    const axes = data.map((s, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const x = center + Math.cos(angle) * maxR;
      const y = center + Math.sin(angle) * maxR;
      const lx = center + Math.cos(angle) * (maxR + 22);
      const ly = center + Math.sin(angle) * (maxR + 22);
      return { angle, x, y, lx, ly, label: s.label };
    });

    const polygonPoints = data
      .map((s, i) => {
        const a = axes[i]?.angle ?? -Math.PI / 2;
        const r = maxR * clamp01((s.value || 0) / 100);
        const px = center + Math.cos(a) * r;
        const py = center + Math.sin(a) * r;
        return `${px},${py}`;
      })
      .join(" ");

    const levelPolys = Array.from({ length: levels }, (_, idx) => {
      const t = (idx + 1) / levels;
      const pts = axes
        .map((ax) => {
          const px = center + Math.cos(ax.angle) * maxR * t;
          const py = center + Math.sin(ax.angle) * maxR * t;
          return `${px},${py}`;
        })
        .join(" ");
      return pts;
    });

    return { center, maxR, axes, polygonPoints, levelPolys };
  }, [data, size, levels]);

  // keep it stable during SSR / empty data
  const ready = computed.axes.length >= 3;
  if (!ready) {
    return <View style={{ width: size, height: size }} />;
  }

  const gridStroke = colors.border;
  const labelColor = colors.textSecondary;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* soft background circle */}
        <Circle
          cx={computed.center}
          cy={computed.center}
          r={computed.maxR + 18}
          fill={colors.surfaceWarm}
          stroke={colors.borderLight}
          strokeWidth={1}
        />

        {/* grid levels */}
        {computed.levelPolys.map((pts, i) => {
          return (
            <Polygon
              key={`lvl-${i}`}
              points={pts}
              fill="transparent"
              stroke={gridStroke}
              strokeWidth={1}
              opacity={0.85}
            />
          );
        })}

        {/* axes */}
        {computed.axes.map((ax, i) => (
          <Line
            key={`ax-${i}`}
            x1={computed.center}
            y1={computed.center}
            x2={ax.x}
            y2={ax.y}
            stroke={gridStroke}
            strokeWidth={1}
            opacity={0.85}
          />
        ))}

        {/* data polygon */}
        <Polygon
          points={computed.polygonPoints}
          fill={fill}
          stroke={stroke}
          strokeWidth={3}
          opacity={0.95}
        />

        {/* vertex dots */}
        {computed.polygonPoints.split(" ").map((pair, i) => {
          const [x, y] = pair.split(",").map((n) => Number(n));
          return (
            <Circle
              key={`pt-${i}`}
              cx={x}
              cy={y}
              r={4.5}
              fill={stroke}
              stroke={colors.surface}
              strokeWidth={2}
            />
          );
        })}

        {/* labels */}
        {computed.axes.map((ax, i) => {
          const anchor =
            ax.lx < computed.center - 5
              ? "end"
              : ax.lx > computed.center + 5
                ? "start"
                : "middle";
          const dy = ax.ly > computed.center ? 14 : -6;
          return (
            <G key={`lbl-${i}`}>
              <SvgText
                x={ax.lx}
                y={ax.ly + dy}
                fill={labelColor}
                fontSize={12}
                fontFamily={typography.fontFamily.semibold}
                textAnchor={anchor}
              >
                {ax.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
