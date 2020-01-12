
/**
 * Spawns ray for calculating colour.
 */
RaytracingWebWorker.prototype.spawnRay = function(rayOrigin, rayDirection, outputColor, recursionDepth) 
{
	let _this = this;

	_this.ray.origin = rayOrigin;
	_this.ray.direction = rayDirection;

	// weird function. somettimes needs a lot of time even though there is not even that much objects in the scene
	let intersections = _this.raycaster.intersectObjects(_this.objects, true);

	outputColor.setRGB(0, 0, 0);

	if (intersections.length === 0) 
	{
		// -----------------------------
		// ray didn't hit any object
		// -----------------------------

		let background = _this.scene.background;

		if (!background || !background.rawImage || !background.rawImage.length)
		{
			return;
		}

		let pixelColor = _this.texCUBE(background.rawImage, rayDirection);
		pixelColor.copyGammaToLinear(pixelColor);
		outputColor.add(pixelColor);

		return;
	}


	// -----------------------------
	// Ray hit one of the objects
	// -----------------------------

	let diffuseColor = new THREE.Color();
	let specularColor = new THREE.Color();
	let lightColor = new THREE.Color();
	let schlick = new THREE.Color();

	let lightContribution = new THREE.Color();

	let eyeVector = new THREE.Vector3();
	let lightVector = new THREE.Vector3();
	let normalVector = new THREE.Vector3();
	let halfVector = new THREE.Vector3();

	let localPoint = new THREE.Vector3();
	let reflectionVector = new THREE.Vector3();

	let tmpVec = new THREE.Vector3();

	let intersection = intersections[0];
	let point = intersection.point;
	let object = intersection.object;
	let material = object.material;
	let face = intersection.face;
	let geometry = object.geometry;
	let _object = _this.cache[object.id];

	eyeVector.subVectors(_this.ray.origin, point).normalize();

	/**
	 * ------------------------------------------
	 * PHONG MODEL:
	 * - diffuse color (base color)
	 * - specular color
	 * - reflectivenes 
	 * 
	 * 
	 * 
	 * ------------------------------------------
	 * PBR MODEL:
	 * - albedo color (base color)
	 * - metallic factor
	 * - roughness factor
	 * 
	 * FO - Fresnel Reflectance at 0 degrees
	 * BRDF - Bidirectional Reflectance Distribution Function
	 * 
	 */

	let albedo = null;

	if (intersection.uv)
	{
		let vectorUV;

		if (material.map)
		{
			// diffuseColor or albedo color
			vectorUV = intersection.uv.clone();
			material.map.transformUv(vectorUV);
			albedo = _this.getTexturePixel(material.map.image, vectorUV.x, vectorUV.y);
		}
	}


	// -----------------------------
	// diffuse color (also called albedo color)
	// -----------------------------

	let diffuse;

	if (albedo)
	{	
		diffuse = albedo;
	}
	else
	{
		diffuse = material.color;
	} 

	diffuseColor.copyGammaToLinear(diffuse);

	if ( material.vertexColors === THREE.FaceColors) 
	{
		diffuseColor.multiply(face.color);
	}
	
	
	// -----------------------------
	// compute light shading
	// -----------------------------

	_this.rayLight.origin.copy(point);	

	if (_this.ambientLight)
	{
		lightContribution.copy(diffuseColor);
		lightContribution.multiply(_this.ambientLight.color);
		lightContribution.multiplyScalar(_this.ambientLight.intensity);
		outputColor.add(lightContribution);
	}


	let alphaMap = null;
	let aoMap = null;
	let emissiveMap = null;
	let envMap = null;
	let lightMap = null;
	let metalnessMap = null;
	let normalMap = null;
	let roughnessMap = null; 

	if (intersection.uv)
	{
		let vectorUV;

		if (material.alphaMap)
		{
			vectorUV = intersection.uv.clone();
			material.alphaMap.transformUv(vectorUV);
			alphaMap = _this.getTexturePixel(material.alphaMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.aoMap)
		{
			// ambient occulsion map
			vectorUV = intersection.uv.clone();
			material.aoMap.transformUv(vectorUV);
			aoMap = _this.getTexturePixel(material.aoMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.emissiveMap)
		{
			vectorUV = intersection.uv.clone();
			material.emissiveMap.transformUv(vectorUV);
			emissiveMap = _this.getTexturePixel(material.emissiveMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.envMap)
		{
			vectorUV = intersection.uv.clone();
			material.envMap.transformUv(vectorUV);
			envMap = _this.getTexturePixel(material.envMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.lightMap)
		{
			vectorUV = intersection.uv.clone();
			material.lightMap.transformUv(vectorUV);
			lightMap = _this.getTexturePixel(material.lightMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.metalnessMap)
		{
			vectorUV = intersection.uv.clone();
			material.metalnessMap.transformUv(vectorUV);
			metalnessMap = _this.getTexturePixel(material.metalnessMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.normalMap)
		{
			vectorUV = intersection.uv.clone();
			material.normalMap.transformUv(vectorUV);
			normalMap = _this.getTexturePixel(material.normalMap.image, vectorUV.x, vectorUV.y);
		}

		if (material.roughnessMap)
		{
			vectorUV = intersection.uv.clone();
			material.roughnessMap.transformUv(vectorUV);
			roughnessMap = _this.getTexturePixel(material.roughnessMap.image, vectorUV.x, vectorUV.y);
		}
	}

	let normalComputed = false;

	for (let i=0; i<_this.lights.length; i++) 
	{
		let light = _this.lights[i];

		lightVector.setFromMatrixPosition(light.matrixWorld);
		lightVector.sub(point);

		_this.rayLight.direction.copy(lightVector).normalize();

		let lightIntersections = _this.raycasterLight.intersectObjects(_this.objects, true);
		
		if (lightIntersections.length > 0) 
		{
			// point in shadow
			continue;
		}

		// point lit

		if (normalComputed === false) 
		{
			// the same normal can be reused for all lights
			// (should be possible to cache even more)

			localPoint.copy( point ).applyMatrix4( _object.inverseMatrix );
			_this.computePixelNormal( normalVector, localPoint, material.flatShading, face, geometry );
			normalVector.applyMatrix3( _object.normalMatrix ).normalize();

			normalComputed = true;
		}

		lightColor.copyGammaToLinear(light.color);

		// compute attenuation

		lightVector.normalize();

		// compute diffuse

		var dot = Math.max( normalVector.dot( lightVector ), 0 );
		var diffuseIntensity = dot * light.intensity;

		lightContribution.copy( diffuseColor );
		lightContribution.multiply( lightColor );
		lightContribution.multiplyScalar(diffuseIntensity);
		outputColor.add( lightContribution );

		// compute specular

		/*if (material.specular || material.shininess) 
		{
			let specular;
			let shininess;

			if (material.specular)
			{
				specular = material.specular;
			}

			if (material.shininess)
			{
				shininess = material.shininess;
			}

			halfVector.addVectors( lightVector, eyeVector ).normalize();

			let dotNormalHalf = Math.max(normalVector.dot(halfVector), 0.0);
			let specularIntensity = Math.max(Math.pow(dotNormalHalf, shininess), 0.0) * diffuseIntensity;

			let specularNormalization = (shininess + 2.0) / 8.0;

			specularColor.copyGammaToLinear(specular);

			let alpha = Math.pow(Math.max( 1.0 - lightVector.dot( halfVector ), 0.0 ), 5.0);

			schlick.r = specularColor.r + ( 1.0 - specularColor.r ) * alpha;
			schlick.g = specularColor.g + ( 1.0 - specularColor.g ) * alpha;
			schlick.b = specularColor.b + ( 1.0 - specularColor.b ) * alpha;

			lightContribution.copy( schlick );
			lightContribution.multiply( lightColor );
			lightContribution.multiplyScalar( specularNormalization * specularIntensity);

			outputColor.add( lightContribution );
		}

		if (roughnessMap) 
		{
			let specular = roughnessMap;

			halfVector.addVectors( lightVector, eyeVector ).normalize();
			specularColor.copyGammaToLinear(specular);

			let alpha = Math.pow(Math.max( 1.0 - lightVector.dot( halfVector ), 0.0 ), 5.0);

			schlick.r = specularColor.r + ( 1.0 - specularColor.r ) * alpha;
			schlick.g = specularColor.g + ( 1.0 - specularColor.g ) * alpha;
			schlick.b = specularColor.b + ( 1.0 - specularColor.b ) * alpha;

			lightContribution.copy( schlick );
			lightContribution.multiply( lightColor );

			outputColor.add( lightContribution );
		}*/
	}


	// -----------------------------
	// reflection / refraction
	// -----------------------------

	if (recursionDepth >= _this.maxRecursionDepth)
	{
		// no need to spawn new ray cast, because we have reached max recursion depth
		return;
	}

	

	let tmpColor = new Array();

	for ( let i = 0; i < _this.maxRecursionDepth; i ++ ) 
	{
		tmpColor[i] = new THREE.Color();
	}	

	if (material.glass) 
	{
		let eta = material.refractionRatio;

		let dotNI = rayDirection.dot( normalVector );
		let k = 1.0 - eta * eta * ( 1.0 - dotNI * dotNI );

		if ( k < 0.0 ) 
		{
			reflectionVector.set( 0, 0, 0 );
		}
		else 
		{
			reflectionVector.copy( rayDirection );
			reflectionVector.multiplyScalar( eta );

			let alpha = eta * dotNI + Math.sqrt( k );
			tmpVec.copy( normalVector );
			tmpVec.multiplyScalar( alpha );
			reflectionVector.sub( tmpVec );
		}

		let theta = Math.max( eyeVector.dot( normalVector ), 0.0 );
		let rf0 = reflectivity;
		let fresnel = rf0 + ( 1.0 - rf0 ) * Math.pow( ( 1.0 - theta ), 5.0 );
		let weight = fresnel;

		let zColor = tmpColor[ recursionDepth ];

		_this.spawnRay( point, reflectionVector, zColor, recursionDepth + 1 );
		
		if ( material.specular !== undefined ) 
		{
			zColor.multiply( material.specular );
		}

		zColor.multiplyScalar( weight );
		outputColor.multiplyScalar( 1 - weight );
		outputColor.add( zColor );

		return;
	}


	var reflectivity;

	if (metalnessMap)
	{
		reflectivity = metalnessMap.b;
	}

	if (material.reflectivity)
	{
		reflectivity = material.reflectivity;
	}

	if (!reflectivity)
	{
		// not reflection means we don't need to spawn ray
		return;
	}
	else
	{
		material.mirror = true;
	}

	if (material.mirror) 
	{
		reflectionVector.copy( rayDirection );
		reflectionVector.reflect( normalVector );

		let theta = Math.max( eyeVector.dot( normalVector ), 0.0 );
		let rf0 = reflectivity;
		let fresnel = rf0 + ( 1.0 - rf0 ) * Math.pow( ( 1.0 - theta ), 5.0 );
		let weight = fresnel;

		let zColor = tmpColor[ recursionDepth ];

		_this.spawnRay( point, reflectionVector, zColor, recursionDepth + 1 );
		
		if ( material.specular !== undefined ) 
		{
			zColor.multiply( material.specular );
		}

		zColor.multiplyScalar( weight );
		outputColor.multiplyScalar( 1 - weight );
		outputColor.add( zColor );

		return;
	}
};
