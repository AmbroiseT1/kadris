"use client";

import React, { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    const modelRef = useRef<THREE.Group>(null);

    useEffect(() => {
        const meshes: THREE.Mesh[] = [];
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                meshes.push(child as THREE.Mesh);
            }
        });

        meshes.forEach((mesh) => {
            // 1. Solid "Paper" Fill
            mesh.material = new THREE.MeshBasicMaterial({
                color: "#ffffff",
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                polygonOffset: true,
                polygonOffsetFactor: 1,
                polygonOffsetUnits: 1,
            });

            // 2. Wireframe Overlay
            // Check if we already added a wireframe child to avoid duplication on re-renders
            const hasWireframeChild = mesh.children.some(
                (c) => c.name === "wireframe-overlay"
            );

            if (!hasWireframeChild) {
                const wireframeMesh = new THREE.Mesh(
                    mesh.geometry,
                    new THREE.MeshBasicMaterial({
                        color: "black",
                        wireframe: true,
                        transparent: true,
                        opacity: 0.15, // Lighter wireframe since we have density
                    })
                );
                wireframeMesh.name = "wireframe-overlay";
                mesh.add(wireframeMesh);
            }
        });
    }, [scene]);

    useFrame((state, delta) => {
        if (modelRef.current) {
            modelRef.current.rotation.y += delta * 0.02; // Slower rotation
        }
    });

    return (
        <group ref={modelRef} dispose={null}>
            <primitive object={scene} scale={2.2} />
        </group>
    );
}

export default function ArchitecturalViewer() {
    return (
        <div className="w-full h-full absolute inset-0 z-0 bg-[#fdfbf7]">
            {/* Paper texture overlay via CSS pattern or just a color for now. 
          The prompt asked for "texture papier subtile". 
          We can add a CSS overlay in the parent component or here. */}
            <div
                className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                }}
            />

            <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
                <Model url="/building-type-b.glb" />
                <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>
        </div>
    );
}
