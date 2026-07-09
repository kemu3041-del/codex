import React, { useRef, useMemo,useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls,useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three-stdlib';

// === Shader 保持不变 ===
const glowingParticleShader = {
  vertex: `
    attribute float size;
    attribute float opacity;
    varying vec3 vColor;
    varying float vOpacity;
    uniform float uPixelRatio;
    uniform float uTime;
    void main() {
      vColor = color;
      vOpacity = opacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      float atten = 300.0 / -mvPosition.z;
      gl_PointSize = size * uPixelRatio * atten;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragment: `
    varying vec3 vColor;
    varying float vOpacity;
    void main() {
      vec2 uv = gl_PointCoord - vec2(0.5);
      float d = length(uv);
      if (d > 0.5) discard;
      float glow = 1.0 - smoothstep(0.1, 0.5, d);
      gl_FragColor = vec4(vColor, glow * vOpacity);
    }
  `
};
const getInitialModelUrl = () => {
  // 安全地从全局对象中读取值，如果不存在则使用一个默认值
  const globalUrl = window.APP_CONFIG?.DYNAMIC_MODEL_URL;
  // 替换为您的默认模型路径
  return globalUrl || './logo3.glb'; 
};
const LoadReporter = () => {
  const { progress } = useProgress();

  useEffect(() => {
    // 检查外部是否定义了进度监听函数
    // 例如 HTML 中定义: window.onLoadProgress = (val) => console.log(val)
    if (typeof window.onLoadProgress === 'function') {
      window.onLoadProgress(progress);
    }
  }, [progress]);

  return null;
};
// === 核心组件 ===
const InteractiveModelParticles = ({ url }) => {
  const { scene } = useGLTF(url);
  const pointsRef = useRef();
  
  // 新增：防止重复调用的锁
  const hasNotifiedIntroRef = useRef(false);

  // 动画与交互状态
  const progressRef = useRef(0); // 入场进度

  // 新增：散场状态
  const disperseRef = useRef(false); 
  const disperseTimeRef = useRef(0);
  
  // 创建一个数学平面，用于捕获鼠标在 3D 空间的位置
  // Plane(normal, constant): 法向量 (0,0,1) 表示面朝屏幕前方，位于 Z=0 处
  const interactionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  // 新增：用于记录鼠标是否在移动
  const mouseActivity = useRef(0); 

  const CONFIG = {
    coreSpeed: 200.0,       // 核心粒子的离场速度 (越小越慢)
    atmosphereSpeed: 8.0,// 氛围粒子的离场速度 (极快，瞬间飞走)
    exitDuration: 2,    // 核心粒子飞完需要多久 (秒) -> 超过这个时间才触发回调
  };

  // === 核心：暴露接口给外部 HTML (Window对象) ===
  useEffect(() => {
    // 1. 定义触发函数：外部调用 window.startExit() 即可开始散场
    window.startExit = () => {
      console.log("React received: Start Exit Animation");
      disperseRef.current = true;
    };

    // 清理函数
    return () => { delete window.startExit; };
  }, []);

  useEffect(() => {
    let touchStartY = 0;

    const triggerDisperse = () => {
      // 如果已经在散场了，或者入场动画还没走完(可选)，则忽略
      if (disperseRef.current) return;
      
      console.log("Triggering Exit via Scroll/Touch");
      disperseRef.current = true;
      
      // 如果你想让 UI 文字同时也淡出，可以在这里调用 window.startExit 里的逻辑
      // 或者依赖 window.onExitComplete 后续处理
    };

    // 1. PC端滚轮处理
    const handleWheel = (e) => {
      // 向下滚动 (deltaY > 0) 触发
      if (e.deltaY > 0) {
        triggerDisperse();
      }
    };

    // 2. 移动端触摸开始
    const handleTouchStart = (e) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    // 3. 移动端触摸移动
    const handleTouchMove = (e) => {
      if (disperseRef.current || e.touches.length === 0) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY;
      
      // 向下滑动手指 (页面内容看起来是向上滚，但逻辑通常是看手势)
      // 如果是指 "向下滑动页面查看更多" -> 手指是向上滑 -> deltaY 为负
      // 这里假设逻辑是：手指向上滑(deltaY < 0)，内容下移，触发离场
      if (deltaY < -20) { 
        triggerDisperse();
      }
    };

    // 添加监听器 (passive: true 优化滚动性能)
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // === 新增监听器：鼠标动，能量满 ===
  useEffect(() => {
    const handleMouseMove = () => {
      // 只要鼠标动了，重置活跃度为 1
      mouseActivity.current = 1.0;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // === 1. 粒子数据生成 (保留了你的自然溢出逻辑) ===
  const { startPositions, targetPositions, colors, sizes,disperseDirections,opacities,types,randomness } = useMemo(() => {
    let mesh = null;
    scene.traverse((child) => {
      if (child.isMesh && !mesh) mesh = child;
    });
    if (!mesh) return {};

    mesh = mesh.clone(); 
    mesh.geometry = mesh.geometry.clone();  
    
    const getScale = () => (window.innerWidth <= 768 ? 0.002 : 0.005);
    let scale = getScale();

    mesh.geometry.scale(scale, scale, scale);
    
    mesh.updateMatrix();
    mesh.geometry.computeBoundingBox();

    // --- A. 准备两种采样器 ---
    
    // 1. 表面采样器 (用于中间稀疏填充)
    const surfaceSampler = new MeshSurfaceSampler(mesh).build();

    // 2. 边缘数据 (用于边缘密集填充)
    // thresholdAngle: 角度阈值，越小提取的线条越多，10-30 比较适合 Logo
    const edgesGeometry = new THREE.EdgesGeometry(mesh.geometry, 20);
    const edgeArray = edgesGeometry.attributes.position.array;
    const edgeCount = edgeArray.length / 3; // 顶点数量
    // 注意：EdgesGeometry 的点是成对出现的 (Line Segments)，每两个点组成一条线

    // --- 

    const numParticles = 2000; // 总粒子数
    // 新增：用于存储每个粒子独特的随机值 (0.0 - 1.0)
    const randomArr = new Float32Array(numParticles);

    const startPos = new Float32Array(numParticles * 3);
    const targetPos = new Float32Array(numParticles * 3);
    const colorArr = new Float32Array(numParticles * 3);
    const sizeArr = new Float32Array(numParticles);
    const opacityArr = new Float32Array(numParticles);

    // 新增：散场速度向量
    // const velocities = new Float32Array(numParticles * 3);
    // 修改：存储纯方向向量，而不是带随机速度的向量
    const directions = new Float32Array(numParticles * 3);
    // 新增：存储粒子类型 (0 = 核心, 1 = 氛围)
    const typeArr = new Float32Array(numParticles);

    const tempPos = new THREE.Vector3();
    const tempColor = new THREE.Color();
    const colorStart = new THREE.Color("#bbd40f");
    const colorEnd = new THREE.Color("#bbd40f"); // 可以改成不同颜色做渐变
    const colorWhite = new THREE.Color("#ffffff");

    const { min, max } = mesh.geometry.boundingBox;
    const height = max.y - min.y || 1;
    const center = new THREE.Vector3();
    mesh.geometry.boundingBox.getCenter(center);

    // --- B. 混合采样比例 ---
    // 75% 的粒子去边缘，25% 的粒子留给表面和溢出
    const edgeParticleCount = Math.floor(numParticles * 0.75); 

    for (let i = 0; i < numParticles; i++) {
      let isEdge = false; // 标记当前粒子是否在边缘
      // === 核心逻辑修改：决定粒子去哪 ===
      if (i < edgeParticleCount && edgeCount > 2) {
        isEdge = true; // 是边缘粒子
        // >> 边缘采样逻辑 <<
        // 随机选一条线段
        // edgeArray 是 [x1,y1,z1, x2,y2,z2, ...]
        // 我们随机选一个偶数索引 startIdx
        const segmentIndex = Math.floor(Math.random() * (edgeCount / 2));
        const startIdx = segmentIndex * 6; // 每一个线段占6个浮点数 (2个点 * 3坐标)
        
        const x1 = edgeArray[startIdx];
        const y1 = edgeArray[startIdx + 1];
        const z1 = edgeArray[startIdx + 2];
        const x2 = edgeArray[startIdx + 3];
        const y2 = edgeArray[startIdx + 4];
        const z2 = edgeArray[startIdx + 5];

        // 在线段上随机插值 (Lerp)
        const t = Math.random();
        tempPos.set(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t,
          z1 + (z2 - z1) * t
        );

      } else {
        isEdge = false; // 是填充粒子
        // >> 表面采样逻辑 (填补中间) <<
        surfaceSampler.sample(tempPos);
      }

      // === 下面是原有的 溢出/颜色/大小 逻辑 (保持不变以维持特效) ===
      const r = Math.random();
      let scatterAmount = 0.05;
      let sizeFactor = 3.0;
      let isAtmosphere = false; // 标记是否为外部氛围粒子

      // 依然保留一部分完全随机的溢出粒子，增加氛围感
      if (r > 0.3) { //稍微提高阈值，让轮廓更清晰
        scatterAmount = 1.5 + Math.random() * 50.0; 
        sizeFactor = 1.5;
        isAtmosphere = true; // 标记为氛围 
      }

      // 记录类型：1为氛围(Atmosphere)，0为核心(Core)
      typeArr[i] = isAtmosphere ? 1.0 : 0.0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // 赋值目标位置
      targetPos[i * 3] = tempPos.x + Math.sin(phi) * Math.cos(theta) * scatterAmount;
      targetPos[i * 3 + 1] = tempPos.y + Math.sin(phi) * Math.sin(theta) * scatterAmount;
      targetPos[i * 3 + 2] = tempPos.z + Math.cos(phi) * scatterAmount;

      // 入场起点 (爆炸中心)
      startPos[i * 3] = center.x + (Math.random() - 0.5) * 30;
      startPos[i * 3 + 1] = center.y + (Math.random() - 0.5) * 30;
      startPos[i * 3 + 2] = center.z + (Math.random() - 0.5) * 30;

      // 颜色计算
      const tHeight = (tempPos.y - min.y) / height;
      tempColor.lerpColors(colorStart, colorEnd, tHeight);
      if (r > 0.90) tempColor.lerp(colorWhite, 0.6);
      
      colorArr[i * 3] = tempColor.r;
      colorArr[i * 3 + 1] = tempColor.g;
      colorArr[i * 3 + 2] = tempColor.b;

      sizeArr[i] = (Math.random() * 0.08 + 0.1) * sizeFactor; 

      // === 计算散场速度 ===
      // 让粒子沿着从中心向外的方向飞，并加点随机噪音
      // 以前这里包含了随机速度，现在我们只计算“归一化方向”
      // 并确保它总是背离中心
      // const dir = new THREE.Vector3(targetPos[i*3], targetPos[i*3+1], targetPos[i*3+2]).sub(center).normalize();
      //velocities[i * 3] = dir.x * (0.05 + Math.random() * 1.5); // 速度随机
      // velocities[i * 3 + 1] = dir.y * (0.05 + Math.random() * 1.5);
      // velocities[i * 3 + 2] = dir.z * (0.05 + Math.random() * 1.5) + 0.5; // 稍微往屏幕外（Z轴正向）飞一点，有冲击感
      // 存入纯方向向量
      // directions[i * 3] = dir.x;
      // directions[i * 3 + 1] = dir.y;
      // directions[i * 3 + 2] = dir.z; // 稍微朝屏幕外偏一点点可以，但主要靠速度控制

      // === 🟢 核心修改：计算更自然的散场方向 ===
      // 原始逻辑是纯粹的中心向外：dir.sub(center).normalize()
      // 现在我们先计算基础径向向量
      const baseDir = new THREE.Vector3(targetPos[i*3], targetPos[i*3+1], targetPos[i*3+2]).sub(center);
      
      // 然后加入随机扰动向量，打破完美的球形/辐射状
      // 扰动大小 (比如 5.0) 决定了初始方向的混乱程度
      baseDir.x += (Math.random() - 0.5) * 5.0;
      baseDir.y += (Math.random() - 0.5) * 5.0;
      baseDir.z += (Math.random() - 0.5) * 5.0;
      
      // 最后再归一化
      baseDir.normalize();

      directions[i * 3] = baseDir.x;
      directions[i * 3 + 1] = baseDir.y;
      directions[i * 3 + 2] = baseDir.z;

      if (isEdge) {
        // 透明度高 (0.8 ~ 1.0)，清晰可见
        opacityArr[i] = 1 + Math.random() * 0.1; 
      } else {
        // 透明度低 (0.1 ~ 0.5)，半透明，营造景深感
        opacityArr[i] = 0.8 + Math.random() * 0.4;
      }
    }

    

    return { 
      startPositions: startPos, 
      targetPositions: targetPos, 
      colors: colorArr, 
      sizes: sizeArr, 
      disperseDirections: directions,
      opacities: opacityArr,
      types: typeArr, // 返回类型数组
      randomness: randomArr
    };
  }, [scene]);

  // === 2. 动画循环 (核心交互修改) ===
  useFrame((state, delta) => {
    if (!pointsRef.current || !targetPositions) return;

    // 1. 更新时间
    pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;

    // 2. 入场动画
    if (progressRef.current < 1) {
      progressRef.current += delta * 0.5;
      progressRef.current = Math.min(progressRef.current, 1);
    }

    // === 🟢 核心修改：通知 HTML ===
    // 比如设定在进度 > 0.9 (快结束) 时通知，这样衔接更流畅
    if (progressRef.current > 0.8 && !hasNotifiedIntroRef.current) {
      hasNotifiedIntroRef.current = true; // 上锁，确保只执行一次
      
      // 检查 HTML 是否定义了这个函数，有的话就调用
      if (typeof window.onIntroFinish === 'function') {
        window.onIntroFinish();
      }
    }


    const easeProgress = easeOutCubic(progressRef.current);

    // === 🟢 3. 关键修改：活跃度衰减 ===
    // 每一帧，活跃度自动减少 (lerp to 0)
    // 0.05 是衰减速度，数值越大，停下后恢复得越快
    mouseActivity.current = THREE.MathUtils.lerp(mouseActivity.current, 0, 0.05);


    // 4. 射线检测
    // B. 交互计算 (仅在未散场时计算)
    let isInteracting = false;
    let intersect = new THREE.Vector3();
    if (!disperseRef.current) {
        state.raycaster.setFromCamera(state.pointer, state.camera);
        state.raycaster.ray.intersectPlane(interactionPlane, intersect);
        // 只有当活跃度 > 0.01 时才计算排斥，否则省点性能
        isInteracting = intersect && progressRef.current > 0.8 && mouseActivity.current > 0.01;
    }
    // C. 散场计时检测
    // let isAnimationFinished = false;
    // if (disperseRef.current) {
    //     disperseTimeRef.current += delta;
    //     // 这里的 2.5 是散场动画持续时间，如果超过，则通知外部
    //     if (disperseTimeRef.current > 0.5 && window.onExitComplete) {
    //          // 防抖，只调用一次
    //          if (!window.hasCalledExit) {
    //              window.hasCalledExit = true;
    //              window.onExitComplete(); 
    //          }
    //     }
    // }
    // === 🟢 核心修改：散场逻辑 & 回调触发 ===
    if (disperseRef.current) {
        disperseTimeRef.current += delta;
        // 触发条件修改：
        // 不再是随便一个 0.5s，而是等待 CONFIG.exitDuration (例如 3秒)
        // 这个时间应该足够让 Core 粒子以 CONFIG.coreSpeed 飞出屏幕
        if (disperseTimeRef.current > CONFIG.exitDuration && window.onExitComplete) {
             if (!window.hasCalledExit) {
                 window.hasCalledExit = true;
                //  console.log("React: Core particles dispersed. Triggering exit.");
                 window.onExitComplete(); 
             }
        }
    }

    // 5. 粒子位置更新
    const positions = pointsRef.current.geometry.attributes.position.array;
    const currentP = new THREE.Vector3();
    const targetP_Base = new THREE.Vector3();
    // === 参数调整区 ===
    // 1. 半径设大一点，让过渡更平滑
    const repelRadius = 50; 
    // 2. 力度也设大一点，保证中心绝对空白
    const maxRepelStrength = 1.0;

    for (let i = 0; i < positions.length; i += 3) {

      currentP.set(positions[i], positions[i+1], positions[i+2]);

      if (disperseRef.current) {
          // === 🟢 散场模式 ===
          // 简单的物理：位置 += 速度 * 加速度因子
          // const speedMultiplier = disperseTimeRef.current * disperseTimeRef.current * 0.1; // 加速飞出
          // currentP.x += disperseVelocities[i] * delta * (50 + speedMultiplier);
          // currentP.y += disperseVelocities[i+1] * delta * (50 + speedMultiplier);
          // currentP.z += disperseVelocities[i+2] * delta * (50 + speedMultiplier);
          // 稍微加点旋转或混乱感
          // currentP.x += Math.sin(state.clock.elapsedTime * 10 + i) * 0.1;
          // === 🟢 核心修改：分离速度逻辑 ===
          // === 🟢 散场模式：核心修改实现自然随机感 ===
          const particleIndex = i / 3;
          const isAtmosphere = types[particleIndex] === 1.0;
          // 获取当前粒子的唯一随机值 (0.0 ~ 1.0)
          const rVal = randomness[particleIndex]; 
          const time = state.clock.elapsedTime;//用于漂移

          let moveSpeed = 0;

          if (isAtmosphere) {
             // 1. 外部氛围粒子：全速飞走，瞬间清空，不要干扰视线
            //  moveSpeed = CONFIG.atmosphereSpeed; 
            // 氛围粒子速度也增加一点随机性 (0.8倍 到 1.3倍之间波动)
             moveSpeed = CONFIG.atmosphereSpeed * (0.8 + rVal * 0.5);
          } else {
             // 核心粒子速度计算：
             // 1. 基础加速：随时间推移越来越快
             let baseSpeed = CONFIG.coreSpeed * (disperseTimeRef.current * 0.7);
             // 2. 个体差异：利用 rVal 让有的粒子快，有的慢 (比如 0.4倍 到 1.6倍之间)
             // 这样粒子群就会拉伸开，不会像一堵墙一样移动
             moveSpeed = baseSpeed * (0.2 + rVal * 1.2);
          }
          
          // --- 计算湍流漂移 (Turbulence Drift) ---
          // 利用 sin/cos 配合时间和粒子的唯一随机值 rVal，制造伪随机的波动路径
          // 不同的 rVal 会导致不同的相位和频率，让每个粒子的漂移路径都不一样
          
          // 漂移力度，随时间稍微增大
          const driftStrength = (2.0 + disperseTimeRef.current * 2.0) * delta;

          // 使用不同的频率参数来计算 XYZ 的漂移量，避免也是走直线
          // time * N 控制变化的快慢，rVal * M 控制个体差异
          // const driftX = Math.sin(time * 1.5 + rVal * 10.0) * driftStrength ;
          // const driftY = Math.cos(time * 1.8 + rVal * 12.0) * driftStrength ; // Y轴漂移稍微小一点点
          // Z轴漂移慢一些，增加纵深感
          const driftZ = Math.sin(time * 1.7 + rVal * 12.0) * driftStrength * 0.5; 

          const driftX = 0;
          const driftY = 0;
          // const driftZ = 0;
          

          // === 最终位置更新 ===
          // 原有路径 (主要方向) + 湍流漂移 (扰动)
          currentP.x += disperseDirections[i] * moveSpeed * delta + driftX;
          currentP.y += disperseDirections[i+1] * moveSpeed * delta + driftY;
          currentP.z += disperseDirections[i+2] * moveSpeed * delta + driftZ;
          
          // 核心粒子稍微加一点旋转干扰，保持有机感，但不要太剧烈
          if (!isAtmosphere) {
            //  currentP.x += Math.sin(state.clock.elapsedTime * 5 + i) * 0.02;
          }

      } else {

        
        targetP_Base.set(
          THREE.MathUtils.lerp(startPositions[i], targetPositions[i], easeProgress),
          THREE.MathUtils.lerp(startPositions[i+1], targetPositions[i+1], easeProgress),
          THREE.MathUtils.lerp(startPositions[i+2], targetPositions[i+2], easeProgress)
        );

        

        if (isInteracting) {
          const dist = currentP.distanceTo(intersect);
          
          // 只有在范围内才计算，优化性能
          if (dist < repelRadius) {
            // === 🟢 核心修改：非线性柔和衰减 ===
            
            // 1. 归一化距离 (0.0 = 中心, 1.0 = 边缘)
            const normalizedDist = dist / repelRadius;
            
            // 2. 使用三次幂 (pow 3) 或 指数函数 来制造“柔和边缘”
            // 这种曲线在中心附近(0.0)数值很高，但还没到边缘(1.0)时就迅速降得很低
            // 这样粒子就不会在边缘处堆积成一个明显的圆环
            // const falloff = Math.pow(1.0 - normalizedDist, 50.0); 
            const falloff = Math.pow(
              (1.0 - normalizedDist) / (1.0 + 0.5 * normalizedDist),
              50.0
            );
            
            // 3. 计算最终力度 (叠加鼠标活跃度)
            const finalForce = falloff * maxRepelStrength * mouseActivity.current;

            // 4. 施加力
            const dirX = currentP.x - intersect.x;
            const dirY = currentP.y - intersect.y;
            // Z轴稍微给少一点，让空洞看起来更像是在同一层面上推开
            const dirZ = (currentP.z - intersect.z) * 0.2; 
            
            const len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ) || 1;
            
            // 增加一点点随机扰动，打破完美的圆形感
            // 利用粒子索引 i 来制造伪随机，让每个粒子受力稍微不同
            const noise = 1.0 + Math.sin(i * 132.4) * 0.2; 

            currentP.x += (dirX / len) * finalForce * noise;
            currentP.y += (dirY / len) * finalForce * noise;
            currentP.z += (dirZ / len) * finalForce * noise;
          }
        }

        // 弹性复位
        // 稍微降低复位速度 (0.08)，让空洞闭合得更有“液体感”
        currentP.lerp(targetP_Base, 0.08);
      }

      positions[i] = currentP.x;
      positions[i + 1] = currentP.y;
      positions[i + 2] = currentP.z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!targetPositions) return null;
  const { gl } = useThree();
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={startPositions.length / 3}
          array={startPositions.slice()} 
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={opacities.length}
          array={opacities}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={glowingParticleShader.vertex}
        fragmentShader={glowingParticleShader.fragment}
        transparent
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uPixelRatio: { value: gl.getPixelRatio() },
          uTime: { value: 0 }
        }}
      />
    </points>
  );
};

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

export default function App() {
  const [modelSource, setModelSource] = useState(getInitialModelUrl);
  return (
    <>
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 2]}>
        {/* <OrbitControls enableDamping /> */}
        <LoadReporter />
        <React.Suspense fallback={null}>
          <InteractiveModelParticles url={modelSource}/>
        </React.Suspense>
      </Canvas>
    </>
  );
}