const ZindozangLogo = ({ size = "100%" }: { size?: number | string }) => {
  return (
    <svg
      width={size}
      viewBox="0 0 280 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ maxWidth: 320 }}
    >
      <defs>
        {/* 🏴‍☠️ [하드코어 브루탈리즘 포스터 필터 - 그대로 유지] */}
        <filter
          id="brutalist-poster"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.95"
            numOctaves="4"
            result="fine-noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="fine-noise"
            scale="2.5"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            result="grain-source"
          />
          <feBlend
            in="displaced"
            in2="grain-source"
            mode="color-burn"
            result="grained"
          />
          <feGaussianBlur in="grained" stdDeviation="0.3" />
        </filter>
      </defs>

      <path
        d="
          M 60,60 
          H 220 
          V 92
          H 180 
          V 124 
          H 140 
          V 156 
          H 100 
          V 188 
          H 60 
          V 220
          H 220
        "
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="square"
        strokeLinejoin="miter"
        filter="url(#brutalist-poster)"
      />

      {/* 🟠 [수정] 주황색 포인트 공 
          - 정정사각형 Z의 첫 번째 꺾임 축 축선(200, 76)으로 완벽하게 싱크 이동 
          - 거친 포스터 필터 적용 */}
      <circle
        cx="200"
        cy="76"
        r="8.5"
        fill="#e07040"
        filter="url(#brutalist-poster)"
      />
    </svg>
  );
};

export default ZindozangLogo;
