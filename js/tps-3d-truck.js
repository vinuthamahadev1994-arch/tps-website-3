/**
 * Total Procurement Solutions (TPS) - 3D Interactive Reefer Truck
 * Procedural Three.js 3D Truck Model with Active Sub-Zero Cold-Chain Effects,
 * 360° Orbit Navigation, Dynamic Cargo Mode Sync, and Full Mobile Touch Support.
 */

(function () {
    "use strict";

    var scene, camera, renderer, truckGroup;
    var wheels = [];
    var vaporParticles, vaporGeom;
    var sideTextureLeft, sideTextureRight, reeferDisplayMesh;
    var underglowLight, headLightL, headLightR;
    var containerElem, canvasElem;

    // Camera orbit parameters
    var radius = 11.5;
    var targetRadius = 11.5;
    var theta = 0.78; // horizontal angle
    var targetTheta = 0.78;
    var phi = 0.32;  // vertical angle
    var targetPhi = 0.32;

    var isDragging = false;
    var previousMousePos = { x: 0, y: 0 };
    var autoRotate = true;
    var lastInteractionTime = Date.now();
    var touchStartDistance = 0;

    // Current Cold Chain Mode
    var currentMode = {
        temp: "-18°C",
        cargo: "Frozen Meat & Poultry",
        status: "Sub-Zero Deep Chill Active",
        color: 0x00d2ff
    };

    function init() {
        canvasElem = document.getElementById("tps3DTruckCanvas");
        containerElem = document.getElementById("truckCanvasWrapper");
        if (!canvasElem || !containerElem) return;

        if (typeof THREE === "undefined") {
            console.warn("Three.js not loaded. 3D Reefer Truck cannot initialize.");
            return;
        }

        // 1. Scene setup
        scene = new THREE.Scene();

        // 2. Camera setup
        var width = containerElem.clientWidth || 600;
        var height = containerElem.clientHeight || 360;
        camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        updateCameraPosition();

        // 3. Renderer setup
        renderer = new THREE.WebGLRenderer({
            canvas: canvasElem,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 4. Lights
        setupLights();

        // 5. Build 3D Reefer Truck
        buildTruck();

        // 6. Ground Shadow & Cybernetic Frost Ring
        buildGroundEffects();

        // 7. Sub-Zero Vapor Particle System
        buildVaporSystem();

        // 8. Event Listeners for Interaction
        setupInteractions();

        // 9. Cargo Mode Listener
        window.addEventListener("tpsReeferModeChange", function (e) {
            if (e.detail && e.detail.data) {
                var d = e.detail.data;
                var colorHex = d.color ? parseInt(d.color.replace("#", "0x"), 16) : 0x00d2ff;
                currentMode = {
                    temp: d.temp,
                    cargo: d.cargo,
                    status: d.status,
                    color: colorHex
                };
                updateTruckBranding();
                if (underglowLight) underglowLight.color.setHex(colorHex);
            }
        });

        // 10. Resize Observer
        if ("ResizeObserver" in window) {
            var ro = new ResizeObserver(function () {
                onResize();
            });
            ro.observe(containerElem);
        } else {
            window.addEventListener("resize", onResize);
        }

        // 11. Start Animation Loop
        animate();
    }

    function setupLights() {
        // Cold-ambient light
        var ambientLight = new THREE.AmbientLight(0xdbeafe, 0.95);
        scene.add(ambientLight);

        // Directional Key Sun
        var dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
        dirLight.position.set(8, 12, 8);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 30;
        dirLight.shadow.camera.left = -6;
        dirLight.shadow.camera.right = 6;
        dirLight.shadow.camera.top = 6;
        dirLight.shadow.camera.bottom = -6;
        scene.add(dirLight);

        // Rim / Back light for crisp 3D contours
        var rimLight = new THREE.DirectionalLight(0x29a8ff, 0.85);
        rimLight.position.set(-8, 6, -8);
        scene.add(rimLight);

        // Front Headlight Spotlights
        headLightL = new THREE.SpotLight(0xffffff, 2.2, 14, Math.PI / 7, 0.4);
        headLightL.position.set(1.1, 1.15, 4.3);
        headLightL.target.position.set(1.1, 0.5, 9.0);
        scene.add(headLightL);
        scene.add(headLightL.target);

        headLightR = new THREE.SpotLight(0xffffff, 2.2, 14, Math.PI / 7, 0.4);
        headLightR.position.set(-1.1, 1.15, 4.3);
        headLightR.target.position.set(-1.1, 0.5, 9.0);
        scene.add(headLightR);
        scene.add(headLightR.target);

        // Sub-Zero Cold Underglow Light
        underglowLight = new THREE.PointLight(0x00d2ff, 1.8, 9);
        underglowLight.position.set(0, 0.5, 0);
        scene.add(underglowLight);
    }

    function createDynamicSideTexture(isLeft) {
        var canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 512;
        var ctx = canvas.getContext("2d");

        // Background: Insulated Glossy Clean White Panel
        ctx.fillStyle = "#f6f8fb";
        ctx.fillRect(0, 0, 1024, 512);

        // Subtle insulation vertical seams
        ctx.strokeStyle = "rgba(0, 112, 216, 0.08)";
        ctx.lineWidth = 3;
        for (var x = 80; x < 1024; x += 120) {
            ctx.beginPath();
            ctx.moveTo(x, 20);
            ctx.lineTo(x, 492);
            ctx.stroke();
        }

        // Top Cold-Chain Border
        ctx.fillStyle = "#0070d8";
        ctx.fillRect(0, 0, 1024, 18);

        // Dynamic Brand Swoosh Wave along bottom
        ctx.beginPath();
        ctx.moveTo(0, 360);
        ctx.bezierCurveTo(300, 340, 600, 410, 1024, 330);
        ctx.lineTo(1024, 512);
        ctx.lineTo(0, 512);
        ctx.closePath();
        ctx.fillStyle = "#0070d8";
        ctx.fill();

        // Lime Accent Wave Stripe
        ctx.beginPath();
        ctx.moveTo(0, 350);
        ctx.bezierCurveTo(300, 330, 600, 400, 1024, 320);
        ctx.lineTo(1024, 332);
        ctx.bezierCurveTo(600, 412, 300, 342, 0, 362);
        ctx.closePath();
        ctx.fillStyle = "#4cb814";
        ctx.fill();

        // Brand Name Text: "TOTAL PROCUREMENT SOLUTIONS"
        ctx.fillStyle = "#0050a8";
        ctx.font = "bold 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("TOTAL PROCUREMENT SOLUTIONS", 130, 130);

        // Subhead: "COLD-CHAIN ROAD TRANSPORT LOGISTICS"
        ctx.fillStyle = "#2d3748";
        ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
        ctx.fillText("COLD-CHAIN REFRIGERATED FLEET", 132, 175);

        // Feature Highlights
        ctx.fillStyle = "#0070d8";
        ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
        ctx.fillText("GPS TELEMETRY  •  100mm PUF INSULATION  •  -25°C to +20°C", 132, 215);

        // Active Temperature Telematics Badge Pill
        ctx.fillStyle = "rgba(0, 40, 90, 0.92)";
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(130, 245, 480, 70, 18);
        } else {
            ctx.rect(130, 245, 480, 70);
        }
        ctx.fill();

        ctx.strokeStyle = "#4cb814";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Snowflake Icon + Live Temp Text
        ctx.fillStyle = "#62d820";
        ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, Arial";
        ctx.fillText("❄️ " + currentMode.temp, 155, 292);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 21px -apple-system, BlinkMacSystemFont, Arial";
        ctx.fillText("LIVE: " + currentMode.cargo.toUpperCase(), 310, 288);

        // Snowflake Brand Emblem Graphic on the left
        ctx.fillStyle = "#0070d8";
        ctx.beginPath();
        ctx.arc(66, 140, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("❄", 66, 154);

        // Mirror for right side if needed
        var tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 4;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return { texture: tex, canvas: canvas, ctx: ctx };
    }

    function updateTruckBranding() {
        if (sideTextureLeft && sideTextureLeft.canvas) {
            var objL = createDynamicSideTexture(true);
            sideTextureLeft.texture.image = objL.canvas;
            sideTextureLeft.texture.needsUpdate = true;
        }
        if (sideTextureRight && sideTextureRight.canvas) {
            var objR = createDynamicSideTexture(false);
            sideTextureRight.texture.image = objR.canvas;
            sideTextureRight.texture.needsUpdate = true;
        }
        if (reeferDisplayMesh && reeferDisplayMesh.material) {
            var ledCanvas = document.createElement("canvas");
            ledCanvas.width = 256;
            ledCanvas.height = 128;
            var lctx = ledCanvas.getContext("2d");
            lctx.fillStyle = "#05111a";
            lctx.fillRect(0, 0, 256, 128);
            lctx.strokeStyle = "#29a8ff";
            lctx.lineWidth = 4;
            lctx.strokeRect(2, 2, 252, 124);
            lctx.fillStyle = "#62d820";
            lctx.font = "bold 56px monospace";
            lctx.textAlign = "center";
            lctx.fillText(currentMode.temp, 128, 76);
            lctx.fillStyle = "#29a8ff";
            lctx.font = "bold 22px Arial";
            lctx.fillText("SET ACTIVE", 128, 108);
            reeferDisplayMesh.material.map = new THREE.CanvasTexture(ledCanvas);
            reeferDisplayMesh.material.needsUpdate = true;
        }
    }

    function buildTruck() {
        truckGroup = new THREE.Group();

        // Standard Materials
        var cabPaintMat = new THREE.MeshStandardMaterial({
            color: 0xf4f7fa,
            roughness: 0.22,
            metalness: 0.18
        });

        var glassMat = new THREE.MeshStandardMaterial({
            color: 0x0a1c30,
            roughness: 0.08,
            metalness: 0.92,
            transparent: true,
            opacity: 0.88
        });

        var chromeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.12,
            metalness: 0.95
        });

        var darkSteelMat = new THREE.MeshStandardMaterial({
            color: 0x20242a,
            roughness: 0.55,
            metalness: 0.65
        });

        var blackPlasticMat = new THREE.MeshStandardMaterial({
            color: 0x181a1d,
            roughness: 0.8,
            metalness: 0.1
        });

        var reeferUnitMat = new THREE.MeshStandardMaterial({
            color: 0x222a33,
            roughness: 0.35,
            metalness: 0.4
        });

        var logoBlueMat = new THREE.MeshStandardMaterial({
            color: 0x0070d8,
            roughness: 0.3,
            metalness: 0.3
        });

        var limeAccentMat = new THREE.MeshStandardMaterial({
            color: 0x4cb814,
            roughness: 0.3,
            emissive: 0x4cb814,
            emissiveIntensity: 0.3
        });

        var tailLightMat = new THREE.MeshStandardMaterial({
            color: 0xff0022,
            emissive: 0xcc0011,
            emissiveIntensity: 0.8,
            roughness: 0.2
        });

        var headLightMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x99ddff,
            emissiveIntensity: 0.95,
            roughness: 0.1
        });

        // -------------------------------------------------------------
        // A. CHASSIS FRAME
        // -------------------------------------------------------------
        var chassisGeo = new THREE.BoxGeometry(0.2, 0.25, 8.4);
        var chassisL = new THREE.Mesh(chassisGeo, darkSteelMat);
        chassisL.position.set(0.65, 0.65, -0.2);
        chassisL.castShadow = true;
        truckGroup.add(chassisL);

        var chassisR = new THREE.Mesh(chassisGeo, darkSteelMat);
        chassisR.position.set(-0.65, 0.65, -0.2);
        chassisR.castShadow = true;
        truckGroup.add(chassisR);

        // Cross members
        for (var cz = -3.8; cz <= 3.4; cz += 1.2) {
            var crossMember = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.18), darkSteelMat);
            crossMember.position.set(0, 0.65, cz);
            truckGroup.add(crossMember);
        }

        // Fuel Tank (Brushed aluminum cylinder on Right side)
        var fuelTankGeo = new THREE.CylinderGeometry(0.36, 0.36, 1.7, 24);
        var fuelTank = new THREE.Mesh(fuelTankGeo, chromeMat);
        fuelTank.rotation.z = Math.PI / 2;
        fuelTank.position.set(-1.18, 0.66, -0.5);
        fuelTank.castShadow = true;
        truckGroup.add(fuelTank);

        // Battery / Tool Box (on Left side)
        var toolBoxGeo = new THREE.BoxGeometry(0.55, 0.44, 1.4);
        var toolBox = new THREE.Mesh(toolBoxGeo, darkSteelMat);
        toolBox.position.set(1.18, 0.66, -0.5);
        toolBox.castShadow = true;
        truckGroup.add(toolBox);

        // Side Underrun Safety Guard Rails (Aluminum barrier bars on both sides)
        for (var side = -1; side <= 1; side += 2) {
            var railTop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 2.6), chromeMat);
            railTop.position.set(side * 1.25, 0.75, -0.5);
            truckGroup.add(railTop);

            var railBottom = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 2.6), chromeMat);
            railBottom.position.set(side * 1.25, 0.52, -0.5);
            truckGroup.add(railBottom);

            // Vertical mounting posts
            for (var pz = -1.6; pz <= 0.6; pz += 1.0) {
                var post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.06), darkSteelMat);
                post.position.set(side * 1.25, 0.63, pz);
                truckGroup.add(post);
            }
        }

        // Heavy-duty Rear Bumper & Taillight bar
        var rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.22, 0.18), darkSteelMat);
        rearBumper.position.set(0, 0.55, -4.5);
        truckGroup.add(rearBumper);

        // Taillights
        var tailL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.06), tailLightMat);
        tailL.position.set(0.85, 0.55, -4.6);
        truckGroup.add(tailL);

        var tailR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.06), tailLightMat);
        tailR.position.set(-0.85, 0.55, -4.6);
        truckGroup.add(tailR);

        // Mudflaps with TPS Royal Blue trim
        var flapGeo = new THREE.BoxGeometry(0.5, 0.48, 0.03);
        var flapL = new THREE.Mesh(flapGeo, blackPlasticMat);
        flapL.position.set(0.95, 0.48, -4.15);
        truckGroup.add(flapL);

        var flapR = new THREE.Mesh(flapGeo, blackPlasticMat);
        flapR.position.set(-0.95, 0.48, -4.15);
        truckGroup.add(flapR);

        // -------------------------------------------------------------
        // B. WHEELS & ALLOY RIMS (6 Wheels)
        // -------------------------------------------------------------
        var wheelPositions = [
            { x: 1.15, y: 0.48, z: 2.9, isDual: false },   // Front Left
            { x: -1.15, y: 0.48, z: 2.9, isDual: false },  // Front Right
            { x: 1.15, y: 0.48, z: -2.2, isDual: true },   // Rear Mid Left
            { x: -1.15, y: 0.48, z: -2.2, isDual: true },  // Rear Mid Right
            { x: 1.15, y: 0.48, z: -3.4, isDual: true },   // Rear Back Left
            { x: -1.15, y: 0.48, z: -3.4, isDual: true }   // Rear Back Right
        ];

        wheelPositions.forEach(function (wpos) {
            var wheelMesh = createDetailedWheel(wpos.isDual);
            wheelMesh.position.set(wpos.x, wpos.y, wpos.z);
            if (wpos.x < 0) {
                wheelMesh.rotation.y = Math.PI;
            }
            truckGroup.add(wheelMesh);
            wheels.push(wheelMesh);
        });

        // -------------------------------------------------------------
        // C. CABIN (Driver's Modern Aerodynamic Cab)
        // -------------------------------------------------------------
        var cabGroup = new THREE.Group();

        // Lower Cab (Engine compartment & base)
        var lowerCabGeo = new THREE.BoxGeometry(2.36, 1.05, 1.95);
        var lowerCab = new THREE.Mesh(lowerCabGeo, cabPaintMat);
        lowerCab.position.set(0, 1.35, 3.1);
        lowerCab.castShadow = true;
        cabGroup.add(lowerCab);

        // Upper Cab Body
        var upperCabGeo = new THREE.BoxGeometry(2.32, 1.15, 1.6);
        var upperCab = new THREE.Mesh(upperCabGeo, cabPaintMat);
        upperCab.position.set(0, 2.38, 2.9);
        upperCab.castShadow = true;
        cabGroup.add(upperCab);

        // Slanted Windshield
        var windshieldGeo = new THREE.BoxGeometry(2.1, 0.92, 0.08);
        var windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.position.set(0, 2.45, 3.74);
        windshield.rotation.x = -0.22;
        cabGroup.add(windshield);

        // Side Cab Windows
        var sideWindowL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.95), glassMat);
        sideWindowL.position.set(1.17, 2.45, 2.95);
        cabGroup.add(sideWindowL);

        var sideWindowR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.95), glassMat);
        sideWindowR.position.set(-1.17, 2.45, 2.95);
        cabGroup.add(sideWindowR);

        // Aerodynamic Cab Roof Fairing / Deflector (channels air smoothly over reefer box)
        var spoilerGeo = new THREE.BoxGeometry(2.28, 0.65, 1.4);
        var spoiler = new THREE.Mesh(spoilerGeo, logoBlueMat);
        spoiler.position.set(0, 3.22, 2.8);
        spoiler.rotation.x = -0.16;
        cabGroup.add(spoiler);

        // Front Grille & TPS Emblem
        var grilleGeo = new THREE.BoxGeometry(1.7, 0.68, 0.1);
        var grille = new THREE.Mesh(grilleGeo, blackPlasticMat);
        grille.position.set(0, 1.45, 4.1);
        cabGroup.add(grille);

        // Chrome horizontal grille slats
        for (var gy = 1.25; gy <= 1.65; gy += 0.13) {
            var slat = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.04, 0.05), chromeMat);
            slat.position.set(0, gy, 4.16);
            cabGroup.add(slat);
        }

        // Centered TPS 3D Badge on grille
        var badge = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 24), limeAccentMat);
        badge.rotation.x = Math.PI / 2;
        badge.position.set(0, 1.48, 4.18);
        cabGroup.add(badge);

        // Front Headlight Clusters (Clear glass housing with dual LED beams)
        var headL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.12), headLightMat);
        headL.position.set(0.92, 1.05, 4.12);
        cabGroup.add(headL);

        var headR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.12), headLightMat);
        headR.position.set(-0.92, 1.05, 4.12);
        cabGroup.add(headR);

        // Turn indicator lenses
        var indMat = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 0.7 });
        var indL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.1), indMat);
        indL.position.set(1.15, 1.05, 4.12);
        cabGroup.add(indL);

        var indR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.1), indMat);
        indR.position.set(-1.15, 1.05, 4.12);
        cabGroup.add(indR);

        // Front Sculpted Bumper & Number Plate
        var bumperGeo = new THREE.BoxGeometry(2.42, 0.32, 0.35);
        var bumper = new THREE.Mesh(bumperGeo, cabPaintMat);
        bumper.position.set(0, 0.82, 4.12);
        cabGroup.add(bumper);

        // Number plate
        var plateGeo = new THREE.BoxGeometry(0.55, 0.14, 0.04);
        var plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        var plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.set(0, 0.75, 4.31);
        cabGroup.add(plate);

        // Side Mirrors (Aerodynamic dual-arm mirrors)
        for (var smSide = -1; smSide <= 1; smSide += 2) {
            var mirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 8), blackPlasticMat);
            mirrorArm.rotation.z = smSide * (Math.PI / 3);
            mirrorArm.position.set(smSide * 1.28, 2.45, 3.45);
            cabGroup.add(mirrorArm);

            var mirrorHousing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.18), blackPlasticMat);
            mirrorHousing.position.set(smSide * 1.45, 2.45, 3.45);
            cabGroup.add(mirrorHousing);

            var mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.38), chromeMat);
            mirrorGlass.rotation.y = smSide * (Math.PI / 2);
            mirrorGlass.position.set(smSide * (1.45 - (smSide * 0.06)), 2.45, 3.45);
            cabGroup.add(mirrorGlass);
        }

        truckGroup.add(cabGroup);

        // -------------------------------------------------------------
        // D. REFRIGERATED CONTAINER (The Reefer Box Body)
        // -------------------------------------------------------------
        var reeferGroup = new THREE.Group();

        // Main Insulated Box Body (width 2.48, height 2.65, length 6.2)
        var boxGeo = new THREE.BoxGeometry(2.48, 2.65, 6.2);

        // Generate Dynamic Texture for Left & Right side panels
        sideTextureLeft = createDynamicSideTexture(true);
        sideTextureRight = createDynamicSideTexture(false);

        var insulatedWhiteMat = new THREE.MeshStandardMaterial({
            color: 0xfafcff,
            roughness: 0.3,
            metalness: 0.05
        });

        // Box Materials array: [right, left, top, bottom, front, back]
        var boxMaterials = [
            new THREE.MeshStandardMaterial({ map: sideTextureRight.texture, roughness: 0.3 }), // Right
            new THREE.MeshStandardMaterial({ map: sideTextureLeft.texture, roughness: 0.3 }),  // Left
            insulatedWhiteMat, // Top
            darkSteelMat,      // Bottom
            insulatedWhiteMat, // Front
            insulatedWhiteMat  // Back
        ];

        var reeferBox = new THREE.Mesh(boxGeo, boxMaterials);
        reeferBox.position.set(0, 2.25, -1.3);
        reeferBox.castShadow = true;
        reeferBox.receiveShadow = true;
        reeferGroup.add(reeferBox);

        // Polished Aluminum Corner Rails along box edges
        var railMat = new THREE.MeshStandardMaterial({ color: 0xd8e4f0, roughness: 0.15, metalness: 0.85 });
        var topRailL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 6.22), railMat);
        topRailL.position.set(1.24, 3.58, -1.3);
        reeferGroup.add(topRailL);

        var topRailR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 6.22), railMat);
        topRailR.position.set(-1.24, 3.58, -1.3);
        reeferGroup.add(topRailR);

        // Roof Structural Ribs
        for (var rz = -4.1; rz <= 1.5; rz += 0.8) {
            var rib = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.04, 0.06), railMat);
            rib.position.set(0, 3.59, rz);
            reeferGroup.add(rib);
        }

        // Front-Mounted Refrigeration Unit (Thermo King / Carrier Reefer Compressor)
        var unitGroup = new THREE.Group();
        var unitHousingGeo = new THREE.BoxGeometry(1.95, 0.95, 0.52);
        var unitHousing = new THREE.Mesh(unitHousingGeo, reeferUnitMat);
        unitHousing.position.set(0, 3.05, 1.95);
        unitGroup.add(unitHousing);

        // Front intake cooling fan grill
        var fanGrillGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 24);
        var fanGrill = new THREE.Mesh(fanGrillGeo, blackPlasticMat);
        fanGrill.rotation.x = Math.PI / 2;
        fanGrill.position.set(0, 3.05, 2.22);
        unitGroup.add(fanGrill);

        // Fan Blades indicator
        var fanBlades = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 6), chromeMat);
        fanBlades.rotation.x = Math.PI / 2;
        fanBlades.position.set(0, 3.05, 2.24);
        unitGroup.add(fanBlades);

        // Digital LED Temperature Display on the side of the refrigeration unit
        var ledGeo = new THREE.PlaneGeometry(0.48, 0.24);
        var ledCanvas = document.createElement("canvas");
        ledCanvas.width = 256;
        ledCanvas.height = 128;
        var lctx = ledCanvas.getContext("2d");
        lctx.fillStyle = "#05111a";
        lctx.fillRect(0, 0, 256, 128);
        lctx.strokeStyle = "#29a8ff";
        lctx.lineWidth = 4;
        lctx.strokeRect(2, 2, 252, 124);
        lctx.fillStyle = "#62d820";
        lctx.font = "bold 56px monospace";
        lctx.textAlign = "center";
        lctx.fillText(currentMode.temp, 128, 76);
        lctx.fillStyle = "#29a8ff";
        lctx.font = "bold 22px Arial";
        lctx.fillText("SET ACTIVE", 128, 108);

        var ledTex = new THREE.CanvasTexture(ledCanvas);
        var ledMat = new THREE.MeshBasicMaterial({ map: ledTex });
        reeferDisplayMesh = new THREE.Mesh(ledGeo, ledMat);
        reeferDisplayMesh.rotation.y = Math.PI / 2;
        reeferDisplayMesh.position.set(1.0, 3.05, 1.95);
        unitGroup.add(reeferDisplayMesh);

        // Active Status Green LED on Reefer unit
        var statusLED = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), limeAccentMat);
        statusLED.position.set(0.68, 3.32, 2.22);
        unitGroup.add(statusLED);

        reeferGroup.add(unitGroup);

        // Rear Double Cargo Doors
        var rearDoorGroup = new THREE.Group();
        var doorL = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.52, 0.05), insulatedWhiteMat);
        doorL.position.set(-0.6, 2.25, -4.42);
        rearDoorGroup.add(doorL);

        var doorR = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.52, 0.05), insulatedWhiteMat);
        doorR.position.set(0.6, 2.25, -4.42);
        rearDoorGroup.add(doorR);

        // Vertical Stainless Steel Locking Bars (4 bars with handles)
        var barPositions = [-0.9, -0.3, 0.3, 0.9];
        barPositions.forEach(function (bx) {
            var lockBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.52, 12), chromeMat);
            lockBar.position.set(bx, 2.25, -4.46);
            rearDoorGroup.add(lockBar);

            // Cam handle lever
            var handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.08), blackPlasticMat);
            handle.position.set(bx, 1.85, -4.5);
            rearDoorGroup.add(handle);
        });

        // Reflective Red/White Safety Chevrons along bottom of rear doors
        var chevronGeo = new THREE.PlaneGeometry(2.36, 0.24);
        var chevCanvas = document.createElement("canvas");
        chevCanvas.width = 512;
        chevCanvas.height = 64;
        var cctx = chevCanvas.getContext("2d");
        for (var cx = -50; cx < 550; cx += 40) {
            cctx.fillStyle = "#ff1744";
            cctx.beginPath();
            cctx.moveTo(cx, 0);
            cctx.lineTo(cx + 25, 64);
            cctx.lineTo(cx + 45, 64);
            cctx.lineTo(cx + 20, 0);
            cctx.fill();

            cctx.fillStyle = "#ffffff";
            cctx.beginPath();
            cctx.moveTo(cx + 20, 0);
            cctx.lineTo(cx + 45, 64);
            cctx.lineTo(cx + 65, 64);
            cctx.lineTo(cx + 40, 0);
            cctx.fill();
        }
        var chevTex = new THREE.CanvasTexture(chevCanvas);
        var chevMat = new THREE.MeshBasicMaterial({ map: chevTex });
        var chevronMesh = new THREE.Mesh(chevronGeo, chevMat);
        chevronMesh.rotation.y = Math.PI;
        chevronMesh.position.set(0, 1.15, -4.46);
        rearDoorGroup.add(chevronMesh);

        reeferGroup.add(rearDoorGroup);
        truckGroup.add(reeferGroup);

        scene.add(truckGroup);
    }

    function createDetailedWheel(isDual) {
        var wheelGroup = new THREE.Group();

        var tireMat = new THREE.MeshStandardMaterial({
            color: 0x181a1d,
            roughness: 0.85,
            metalness: 0.05
        });

        var rimMat = new THREE.MeshStandardMaterial({
            color: 0xd8e0e8,
            roughness: 0.2,
            metalness: 0.85
        });

        var hubMat = new THREE.MeshStandardMaterial({
            color: 0x0070d8,
            roughness: 0.3,
            metalness: 0.5
        });

        var tireWidth = isDual ? 0.44 : 0.28;
        var tireGeo = new THREE.CylinderGeometry(0.48, 0.48, tireWidth, 24);
        var tire = new THREE.Mesh(tireGeo, tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        wheelGroup.add(tire);

        // Alloy Rim
        var rimGeo = new THREE.CylinderGeometry(0.33, 0.33, tireWidth + 0.01, 20);
        var rim = new THREE.Mesh(rimGeo, rimMat);
        rim.rotation.z = Math.PI / 2;
        wheelGroup.add(rim);

        // Center Axle Hub Cap
        var hubGeo = new THREE.CylinderGeometry(0.12, 0.12, tireWidth + 0.04, 16);
        var hub = new THREE.Mesh(hubGeo, hubMat);
        hub.rotation.z = Math.PI / 2;
        wheelGroup.add(hub);

        // Lug Nuts in ring
        for (var a = 0; a < Math.PI * 2; a += Math.PI / 5) {
            var lug = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 6), rimMat);
            lug.rotation.z = Math.PI / 2;
            lug.position.set((tireWidth / 2) + 0.01, Math.cos(a) * 0.22, Math.sin(a) * 0.22);
            wheelGroup.add(lug);
        }

        return wheelGroup;
    }

    function buildGroundEffects() {
        // Soft Realistic Ground Contact Shadow
        var shadowCanvas = document.createElement("canvas");
        shadowCanvas.width = 512;
        shadowCanvas.height = 512;
        var sctx = shadowCanvas.getContext("2d");
        var grad = sctx.createRadialGradient(256, 256, 40, 256, 256, 240);
        grad.addColorStop(0, "rgba(0, 10, 25, 0.85)");
        grad.addColorStop(0.5, "rgba(0, 30, 70, 0.45)");
        grad.addColorStop(0.8, "rgba(0, 112, 216, 0.15)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 512, 512);

        var shadowTex = new THREE.CanvasTexture(shadowCanvas);
        var shadowGeo = new THREE.PlaneGeometry(12, 16);
        var shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            opacity: 0.9,
            depthWrite: false
        });
        var shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = 0.01;
        scene.add(shadowPlane);

        // Cold-Chain Technology Ground Ring
        var ringGeo = new THREE.RingGeometry(5.2, 5.35, 64);
        var ringMat = new THREE.MeshBasicMaterial({
            color: 0x29a8ff,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        scene.add(ring);
    }

    function buildVaporSystem() {
        var particleCount = 75;
        vaporGeom = new THREE.BufferGeometry();
        var positions = new Float32Array(particleCount * 3);
        var opacities = new Float32Array(particleCount);

        for (var i = 0; i < particleCount; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 1.6; // x
            positions[i * 3 + 1] = 2.8 + Math.random() * 0.8;    // y (near reefer unit)
            positions[i * 3 + 2] = 1.6 - Math.random() * 3.5;    // z (drifting back)
            opacities[i] = Math.random();
        }

        vaporGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        // Soft circle texture for vapor particles
        var pCanvas = document.createElement("canvas");
        pCanvas.width = 64;
        pCanvas.height = 64;
        var pctx = pCanvas.getContext("2d");
        var pGrad = pctx.createRadialGradient(32, 32, 2, 32, 32, 30);
        pGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        pGrad.addColorStop(0.4, "rgba(165, 235, 255, 0.55)");
        pGrad.addColorStop(1, "rgba(0, 112, 216, 0)");
        pctx.fillStyle = pGrad;
        pctx.fillRect(0, 0, 64, 64);

        var pTexture = new THREE.CanvasTexture(pCanvas);
        var vaporMat = new THREE.PointsMaterial({
            size: 0.55,
            map: pTexture,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        vaporParticles = new THREE.Points(vaporGeom, vaporMat);
        scene.add(vaporParticles);
    }

    function updateCameraPosition() {
        camera.position.x = targetRadius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = targetRadius * Math.sin(phi) + 1.2;
        camera.position.z = targetRadius * Math.cos(theta) * Math.cos(phi);
        camera.lookAt(0, 1.8, 0);
    }

    function setupInteractions() {
        var el = containerElem;

        // Mouse Drag Orbit
        el.addEventListener("mousedown", function (e) {
            isDragging = true;
            autoRotate = false;
            previousMousePos = { x: e.clientX, y: e.clientY };
            lastInteractionTime = Date.now();
        });

        window.addEventListener("mousemove", function (e) {
            if (!isDragging) return;
            var deltaX = e.clientX - previousMousePos.x;
            var deltaY = e.clientY - previousMousePos.y;

            targetTheta += deltaX * 0.008;
            targetPhi -= deltaY * 0.006;
            targetPhi = Math.max(0.08, Math.min(Math.PI / 2.3, targetPhi));

            previousMousePos = { x: e.clientX, y: e.clientY };
            lastInteractionTime = Date.now();
        });

        window.addEventListener("mouseup", function () {
            isDragging = false;
        });

        // Mouse Scroll Zoom
        el.addEventListener("wheel", function (e) {
            e.preventDefault();
            targetRadius += e.deltaY * 0.008;
            targetRadius = Math.max(7.0, Math.min(18.0, targetRadius));
            lastInteractionTime = Date.now();
        }, { passive: false });

        // Touch Drag & Pinch Orbit on Mobile Devices
        el.addEventListener("touchstart", function (e) {
            if (e.touches.length === 1) {
                isDragging = true;
                autoRotate = false;
                previousMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            } else if (e.touches.length === 2) {
                touchStartDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
            lastInteractionTime = Date.now();
        }, { passive: true });

        el.addEventListener("touchmove", function (e) {
            if (e.touches.length === 1 && isDragging) {
                var deltaX = e.touches[0].clientX - previousMousePos.x;
                var deltaY = e.touches[0].clientY - previousMousePos.y;

                targetTheta += deltaX * 0.01;
                targetPhi -= deltaY * 0.008;
                targetPhi = Math.max(0.08, Math.min(Math.PI / 2.3, targetPhi));

                previousMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                lastInteractionTime = Date.now();
            } else if (e.touches.length === 2) {
                var currentDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                var diff = touchStartDistance - currentDist;
                targetRadius += diff * 0.015;
                targetRadius = Math.max(7.0, Math.min(18.0, targetRadius));
                touchStartDistance = currentDist;
                lastInteractionTime = Date.now();
            }
        }, { passive: true });

        el.addEventListener("touchend", function () {
            isDragging = false;
        }, { passive: true });

        // Auto-Spin Toggle Button
        var btnToggleRotate = document.getElementById("btnToggleRotate");
        var spinStatusText = document.getElementById("spinStatusText");
        if (btnToggleRotate) {
            btnToggleRotate.addEventListener("click", function () {
                autoRotate = !autoRotate;
                if (spinStatusText) spinStatusText.textContent = autoRotate ? "ON" : "OFF";
                lastInteractionTime = autoRotate ? 0 : Date.now() + 9999999;
            });
        }

        // Reset View Button
        var btnResetView = document.getElementById("btnResetView");
        if (btnResetView) {
            btnResetView.addEventListener("click", function () {
                targetTheta = 0.78;
                targetPhi = 0.32;
                targetRadius = 11.5;
                autoRotate = true;
                if (spinStatusText) spinStatusText.textContent = "ON";
                setActiveAngleButton("iso");
            });
        }

        // Camera Preset Angle Switchers
        var angleButtons = document.querySelectorAll(".btn-angle");
        angleButtons.forEach(function (btn) {
            btn.addEventListener("click", function () {
                angleButtons.forEach(function (b) { b.classList.remove("active"); });
                btn.classList.add("active");
                var angle = btn.getAttribute("data-angle");
                applyCameraAngle(angle);
            });
        });
    }

    function applyCameraAngle(angle) {
        lastInteractionTime = Date.now();
        if (angle === "iso") {
            targetTheta = 0.78;
            targetPhi = 0.32;
            targetRadius = 11.5;
        } else if (angle === "side") {
            targetTheta = Math.PI / 2; // 90 deg: Full side view displaying TPS logo
            targetPhi = 0.16;
            targetRadius = 11.0;
        } else if (angle === "front") {
            targetTheta = 0.02; // Front cab, headlights, grille
            targetPhi = 0.18;
            targetRadius = 9.8;
        } else if (angle === "rear") {
            targetTheta = Math.PI; // 180 deg: Rear cargo doors & locking bars
            targetPhi = 0.18;
            targetRadius = 10.2;
        } else if (angle === "top") {
            targetTheta = 0.85;
            targetPhi = 0.95; // High 3D isometric roof overview
            targetRadius = 13.5;
        }
    }

    function setActiveAngleButton(angle) {
        var angleButtons = document.querySelectorAll(".btn-angle");
        angleButtons.forEach(function (b) {
            if (b.getAttribute("data-angle") === angle) {
                b.classList.add("active");
            } else {
                b.classList.remove("active");
            }
        });
    }

    function onResize() {
        if (!containerElem || !renderer || !camera) return;
        var w = containerElem.clientWidth;
        var h = containerElem.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Resume auto-rotation after 2.5 seconds of inactivity
        if (!isDragging && Date.now() - lastInteractionTime > 2500) {
            targetTheta += 0.0035;
        }

        // Smooth Camera Damping (silky interpolation)
        theta += (targetTheta - theta) * 0.08;
        phi += (targetPhi - phi) * 0.08;
        radius += (targetRadius - radius) * 0.08;

        updateCameraPosition();

        // Animate Wheels slightly while auto-spinning for realistic movement
        if (wheels.length > 0 && !isDragging) {
            wheels.forEach(function (w) {
                w.children[0].rotation.x += 0.015;
            });
        }

        // Animate Sub-Zero Cold Vapor Particles
        if (vaporParticles && vaporGeom) {
            var positions = vaporGeom.attributes.position.array;
            for (var i = 0; i < positions.length; i += 3) {
                positions[i + 2] -= 0.025; // drift backward along Z
                positions[i + 1] -= 0.004; // drift slightly downward
                positions[i + 0] += (Math.random() - 0.5) * 0.008; // turbulent swirl

                // Respawn particle at reefer vents
                if (positions[i + 2] < -4.8 || positions[i + 1] < 0.6) {
                    positions[i + 0] = (Math.random() - 0.5) * 1.6;
                    positions[i + 1] = 2.8 + Math.random() * 0.7;
                    positions[i + 2] = 1.9;
                }
            }
            vaporGeom.attributes.position.needsUpdate = true;
        }

        // Subtle truck idle floating breath
        if (truckGroup) {
            truckGroup.position.y = Math.sin(Date.now() * 0.002) * 0.02;
        }

        renderer.render(scene, camera);
    }

    // Auto-init on DOM Ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
