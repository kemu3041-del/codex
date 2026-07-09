import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three-stdlib';

const vertex = new THREE.Vector3();
const instanceMatrix = new THREE.Matrix4();
const worldMatrix = new THREE.Matrix4();

function appendMeshTriangles(mesh, output, triangleLimitState) {
  const geometry = mesh.geometry;
  const position = geometry?.getAttribute('position');
  if (!position) return;

  // 在读取蒙皮顶点前刷新骨骼矩阵，确保得到模型当前姿态而非未计算状态。
  if (mesh.isSkinnedMesh) mesh.skeleton.update();

  const index = geometry.index;
  const triangleCount = Math.floor((index ? index.count : position.count) / 3);
  const remaining = triangleLimitState.limit - triangleLimitState.count;
  if (remaining <= 0) return;

  // 超大模型按固定步长抽取三角形，控制初始化内存和 EdgesGeometry 成本。
  const acceptedCount = Math.min(triangleCount, remaining);
  const triangleStep = triangleCount / acceptedCount;
  const instanceCount = mesh.isInstancedMesh ? mesh.count : 1;

  for (let instance = 0; instance < instanceCount && triangleLimitState.count < triangleLimitState.limit; instance += 1) {
    if (mesh.isInstancedMesh) {
      mesh.getMatrixAt(instance, instanceMatrix);
      worldMatrix.multiplyMatrices(mesh.matrixWorld, instanceMatrix);
    } else {
      worldMatrix.copy(mesh.matrixWorld);
    }

    for (let sample = 0; sample < acceptedCount && triangleLimitState.count < triangleLimitState.limit; sample += 1) {
      const triangleIndex = Math.min(triangleCount - 1, Math.floor(sample * triangleStep));

      for (let corner = 0; corner < 3; corner += 1) {
        const sourceIndex = index ? index.getX(triangleIndex * 3 + corner) : triangleIndex * 3 + corner;
        // getVertexPosition 同时覆盖普通 Mesh、蒙皮和当前 morph target 形态。
        mesh.getVertexPosition(sourceIndex, vertex);
        vertex.applyMatrix4(worldMatrix);
        output.push(vertex.x, vertex.y, vertex.z);
      }

      triangleLimitState.count += 1;
    }
  }
}

function createNormalizedGeometry(scene, modelSize, sourceTriangleLimit) {
  scene.updateMatrixWorld(true);
  const vertices = [];
  const limitState = { count: 0, limit: sourceTriangleLimit };

  scene.traverse((child) => {
    if (child.isMesh) appendMeshTriangles(child, vertices, limitState);
  });

  if (vertices.length < 9) {
    throw new Error('模型中没有可用于粒子采样的三角形 Mesh。');
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingBox();

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  geometry.boundingBox.getCenter(center);
  const maxDimension = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
    geometry.dispose();
    throw new Error('模型尺寸无效，无法自动归一化。');
  }

  // 先应用全部世界变换，再自动居中和统一尺寸，因此更换模型无需手调 scale。
  geometry.translate(-center.x, -center.y, -center.z);
  const scale = modelSize / maxDimension;
  geometry.scale(scale, scale, scale);
  geometry.computeBoundingBox();

  return geometry;
}

function writeSphereOffset(target, offset, radius, depthScale = 1) {
  const theta = Math.random() * Math.PI * 2;
  const z = Math.random() * 2 - 1;
  const radial = Math.sqrt(1 - z * z);
  target[offset] += radial * Math.cos(theta) * radius;
  target[offset + 1] += radial * Math.sin(theta) * radius;
  target[offset + 2] += z * radius * depthScale;
}

function createEdgeClusters(segmentCount, clusterCount, spread) {
  return Array.from({ length: Math.min(clusterCount, Math.max(1, segmentCount * 4)) }, () => ({
    segment: Math.floor(Math.random() * segmentCount),
    center: Math.random(),
    spread: spread * THREE.MathUtils.lerp(0.45, 1.4, Math.random())
  }));
}

function getClusteredInterpolation(cluster) {
  // 三次均匀随机相加后趋近钟形分布，让粒子在簇中心密、边缘疏。
  const centeredRandom = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  return THREE.MathUtils.clamp(cluster.center + centeredRandom * cluster.spread, 0, 1);
}

export function buildModelParticleData(scene, config, profile) {
  const geometry = createNormalizedGeometry(scene, profile.modelSize, config.sourceTriangleLimit);
  const samplerMesh = new THREE.Mesh(geometry);
  const surfaceSampler = new MeshSurfaceSampler(samplerMesh).build();
  const edgesGeometry = new THREE.EdgesGeometry(geometry, config.edgeThreshold);
  const edgePositions = edgesGeometry.getAttribute('position');
  const edgeSegmentCount = Math.floor((edgePositions?.count || 0) / 2);
  const edgeClusters = edgeSegmentCount > 0
    ? createEdgeClusters(edgeSegmentCount, config.edgeClusterCount, config.edgeClusterSpread)
    : [];
  const count = profile.particleCount;

  const startPositions = new Float32Array(count * 3);
  const targetPositions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const opacities = new Float32Array(count);
  const exitDirections = new Float32Array(count * 3);
  const types = new Float32Array(count);
  const randomness = new Float32Array(count);

  const sampled = new THREE.Vector3();
  const color = new THREE.Color();
  const baseColor = new THREE.Color(config.particleColor);
  const highlightColor = new THREE.Color(config.highlightColor);
  const startRadius = profile.modelSize * 1.35;

  for (let particleIndex = 0; particleIndex < count; particleIndex += 1) {
    const offset = particleIndex * 3;
    const randomValue = Math.random();
    const isAtmosphere = Math.random() < config.atmosphereRatio;
    const useEdge = !isAtmosphere && edgeSegmentCount > 0 && Math.random() < config.edgeRatio;

    if (useEdge) {
      const useCluster = edgeClusters.length > 0 && Math.random() < config.edgeClusterRatio;
      const cluster = useCluster
        ? edgeClusters[Math.floor(Math.random() * edgeClusters.length)]
        : null;
      const segment = (cluster?.segment ?? Math.floor(Math.random() * edgeSegmentCount)) * 2;
      const interpolation = cluster ? getClusteredInterpolation(cluster) : Math.random();
      sampled.fromBufferAttribute(edgePositions, segment).lerp(
        vertex.fromBufferAttribute(edgePositions, segment + 1),
        interpolation
      );
    } else {
      surfaceSampler.sample(sampled);
    }

    targetPositions[offset] = sampled.x;
    targetPositions[offset + 1] = sampled.y;
    targetPositions[offset + 2] = sampled.z;

    if (useEdge) {
      // 大多数点只轻微偏离边缘，极少数点明显游离，避免机械描边。
      const edgeJitter = Math.pow(Math.random(), 3) * config.edgeJitterMax;
      writeSphereOffset(targetPositions, offset, edgeJitter);
    }

    // 长尾距离分布把一部分粒子推到画面外围，形成大范围空气感和纵深。
    if (isAtmosphere) {
      const distance = THREE.MathUtils.lerp(
        config.atmosphereMinDistance,
        config.atmosphereMaxDistance,
        Math.pow(Math.random(), 0.42)
      );
      writeSphereOffset(targetPositions, offset, distance, 0.35);
    }

    startPositions[offset] = (Math.random() - 0.5) * startRadius * 2;
    startPositions[offset + 1] = (Math.random() - 0.5) * startRadius * 2;
    startPositions[offset + 2] = (Math.random() - 0.5) * startRadius * 2;

    color.copy(baseColor);
    const isHighlight = randomValue > 1 - config.highlightRatio;
    if (isHighlight) color.lerp(highlightColor, 0.82);
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;

    types[particleIndex] = isAtmosphere ? 1 : 0;
    randomness[particleIndex] = randomValue;
    // 三次幂形成长尾粒径：大量微尘、少量中型粒子、极少数高亮大光点。
    if (isHighlight) {
      sizes[particleIndex] = THREE.MathUtils.lerp(0.38, 0.65, Math.random());
      opacities[particleIndex] = THREE.MathUtils.lerp(0.88, 1, Math.random());
    } else if (isAtmosphere) {
      sizes[particleIndex] = 0.06 + Math.pow(Math.random(), 3.4) * 0.26;
      opacities[particleIndex] = 0.12 + Math.pow(Math.random(), 1.8) * 0.75;
    } else if (useEdge) {
      sizes[particleIndex] = 0.13 + Math.pow(Math.random(), 2.5) * 0.38;
      opacities[particleIndex] = 0.62 + Math.pow(Math.random(), 1.5) * 0.38;
    } else {
      sizes[particleIndex] = 0.09 + Math.pow(Math.random(), 2.8) * 0.28;
      opacities[particleIndex] = 0.34 + Math.pow(Math.random(), 1.8) * 0.66;
    }

    sampled.set(targetPositions[offset], targetPositions[offset + 1], targetPositions[offset + 2]);
    sampled.addScaledVector(vertex.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5), 0.45);
    if (sampled.lengthSq() < 0.0001) sampled.set(0, 0, 1);
    sampled.normalize();
    exitDirections[offset] = sampled.x;
    exitDirections[offset + 1] = sampled.y;
    exitDirections[offset + 2] = sampled.z;
  }

  geometry.dispose();
  edgesGeometry.dispose();

  return {
    startPositions,
    targetPositions,
    colors,
    sizes,
    opacities,
    exitDirections,
    types,
    randomness
  };
}
