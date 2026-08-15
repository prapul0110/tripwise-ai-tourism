import { useEffect, useRef } from "react";
import * as THREE from "three";

export type SceneKind = "globe" | "particles" | "terrain" | "orbit" | "halo" | "constellation";

export function ThreeBackground({ scene }: { scene: SceneKind }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const world = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const teal = new THREE.Color("#78f486");
    const dimTeal = new THREE.Color("#136b35");
    const group = new THREE.Group();
    world.add(group);
    const ambient = new THREE.AmbientLight(0xa1ffa5, 1.25);
    const point = new THREE.PointLight(0x6df77c, 7, 50);
    point.position.set(4, 3, 5);
    world.add(ambient, point);
    let rotating: THREE.Object3D = group;

    if (scene === "globe") {
      camera.position.set(0, 0, 6.4);
      const globe = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2.05, 3),
        new THREE.MeshBasicMaterial({ color: teal, wireframe: true, transparent: true, opacity: 0.28 })
      );
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(2.55, 0.014, 10, 160),
        new THREE.MeshBasicMaterial({ color: teal, transparent: true, opacity: 0.74 })
      );
      halo.rotation.x = 1.05;
      group.add(globe, halo);
      for (let index = 0; index < 90; index += 1) {
        const theta = index * 2.39996;
        const y = 1 - (index / 89) * 2;
        const radius = Math.sqrt(1 - y * y) * 2.13;
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), new THREE.MeshBasicMaterial({ color: teal }));
        dot.position.set(Math.cos(theta) * radius, y * 2.13, Math.sin(theta) * radius);
        group.add(dot);
      }
    } else if (scene === "particles" || scene === "constellation") {
      camera.position.set(0, 0, 7);
      const count = scene === "particles" ? 700 : 160;
      const positions = new Float32Array(count * 3);
      for (let index = 0; index < count; index += 1) {
        const angle = index * 0.618;
        const radius = scene === "particles" ? 1.6 + (index % 37) / 12 : 1 + (index % 19) / 9;
        positions[index * 3] = Math.cos(angle) * radius;
        positions[index * 3 + 1] = Math.sin(angle * 1.7) * radius * 0.7;
        positions[index * 3 + 2] = Math.sin(angle * 0.73) * 1.4;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: teal, size: scene === "particles" ? 0.032 : 0.05, transparent: true, opacity: 0.7, sizeAttenuation: true }));
      group.add(particles);
      rotating = particles;
    } else if (scene === "terrain") {
      camera.position.set(0, 4.5, 7.5);
      camera.lookAt(0, 0, 0);
      const geometry = new THREE.PlaneGeometry(10, 7, 44, 32);
      const positions = geometry.attributes.position;
      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index);
        const y = positions.getY(index);
        positions.setZ(index, Math.sin(x * 1.1) * 0.32 + Math.cos(y * 1.6) * 0.24 + Math.sin((x + y) * 1.7) * 0.16);
      }
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: dimTeal, wireframe: true, transparent: true, opacity: 0.53, roughness: 0.35, metalness: 0.3 }));
      mesh.rotation.x = -1.12;
      mesh.position.y = -1.15;
      group.add(mesh);
      rotating = mesh;
    } else {
      camera.position.set(0, 0, 6.2);
      const ringCount = scene === "halo" ? 5 : 3;
      for (let index = 0; index < ringCount; index += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.2 + index * 0.5, 0.018 + index * 0.006, 10, 128),
          new THREE.MeshBasicMaterial({ color: index % 2 ? dimTeal : teal, transparent: true, opacity: 0.55 })
        );
        ring.rotation.set(index * 0.7, index * 0.48, index * 0.3);
        group.add(ring);
      }
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    const render = (time = 0) => {
      if (!reducedMotion) {
        group.rotation.y = time * 0.00012;
        group.rotation.x = Math.sin(time * 0.00019) * 0.12;
        if (scene === "particles" || scene === "constellation") rotating.rotation.z = time * 0.0002;
        if (scene === "terrain") rotating.rotation.z = Math.sin(time * 0.00016) * 0.06;
      }
      renderer.render(world, camera);
      if (!reducedMotion) animationFrame = requestAnimationFrame(render);
    };
    render();
    const resize = () => {
      camera.aspect = mount.clientWidth / Math.max(1, mount.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.render(world, camera);
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [scene]);

  return <div aria-hidden="true" ref={mountRef} className="three-background" />;
}
