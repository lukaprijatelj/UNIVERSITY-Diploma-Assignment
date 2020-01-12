
RaytracingWebWorker.prototype.spawnPbrRay = function( rayOrigin, rayDirection, outputColor, recursionDepth, inout uvec2 seed, inout bool rayHitIsDynamic )
{
	_this.ray.origin = rayOrigin;
	_this.ray.direction = rayDirection;

	Sphere light = spheres[0];
	Ray firstRay;

	let accumCol = new THREE.Vector3(0);
	let mask = new THREE.Vector3(1.0);
	let firstMask = new THREE.Vector3(1);
	let checkCol0 = new THREE.Vector3(1);
	let checkCol1 = new THREE.Vector3(0.5);
	let dirToLight;
	let tdir;
	let metallicRoughness = new THREE.Vector3(0);
	let x, n, nl;
		
	let t = INFINITY;
	let nc, nt, ratioIoR, Re, Tr;
	let weight;
	let diffuseColorBleeding = 0.3; // range: 0.0 - 0.5, amount of color bleeding between surfaces
		
	let diffuseCount = 0;
	let previousIntersecType = -100;

	let bounceIsSpecular = true;
	let sampleLight = false;
	let firstTypeWasREFR = false;
	let reflectionTime = false;
	let firstTypeWasDIFF = false;
	let shadowTime = false;
	let firstTypeWasCOAT = false;
	let specularTime = false;
	let sampleSunLight = false;
	let intersectionType = '';

	outputColor.setRGB(0, 0, 0);

	for (let bounces = 0; bounces < _this.maxRecursionDepth; bounces++)
	{

		// weird function. somettimes needs a lot of time even though there is not even that much objects in the scene
		let intersections = _this.raycaster.intersectObjects(_this.objects, true);
		

		
		if (intersections.length === 0) 
		{
			if (bounces == 0)
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

				// if ray bounced off of diffuse material and hits sky
				if (previousIntersecType == 'DIFF')
				{
					if (sampleSunLight)
						accumCol = mask * uSunColor * uSunLightIntensity;
					else
						accumCol = mask * Get_HDR_Color(r) * uSkyLightIntensity;

					break;
				}

				break;
			}			

			// if ray bounced off of glass and hits sky
			if (previousIntersecType == 'REFR')
			{
				if (diffuseCount == 0) // camera looking through glass, hitting the sky
					mask *= Get_HDR_Color(r);
				else if (sampleSunLight) // sun rays going through glass, hitting another surface
					mask *= uSunColor * uSunLightIntensity;
				else  // sky rays going through glass, hitting another surface
					mask *= Get_HDR_Color(r) * uSkyLightIntensity;

				if (bounceIsSpecular) // prevents sun 'fireflies' on diffuse surfaces
					accumCol = mask;

				break;
			}
		}

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
	
		if (roughnessMap && metalnessMap)
		{
			intersectionType = 'PBR';
		}



		
		if (bounces == 0)
			rayHitIsDynamic = intersections.isDynamic;


		if (intersectionType == 'LIGHT')
		{	
			if (bounces == 0)
			{
				accumCol = mask * intersections.emission;
				break;
			}

			if (firstTypeWasDIFF)
			{
				if (!shadowTime) 
				{
					accumCol = mask * intersections.emission * 0.5;
					
					// start back at the diffuse surface, but this time follow shadow ray branch
					r = firstRay;
					r.direction = normalize(r.direction);
					mask = firstMask;

					// set/reset variables
					shadowTime = true;
					bounceIsSpecular = false;
					sampleLight = true;

					// continue with the shadow ray
					continue;
				}
				
				accumCol += mask * intersections.emission * 0.5; // add shadow ray result to the colorbleed result (if any)
				break;
			}

			if (firstTypeWasREFR)
			{
				if (!reflectionTime) 
				{
					if (sampleLight || bounceIsSpecular)
						accumCol = mask * intersections.emission;
					
					// start back at the refractive surface, but this time follow reflective branch
					r = firstRay;
					r.direction = normalize(r.direction);
					mask = firstMask;

					// set/reset variables
					reflectionTime = true;
					bounceIsSpecular = true;
					sampleLight = false;

					// continue with the reflection ray
					continue;
				}
				
				accumCol += mask * intersections.emission; // add reflective result to the refractive result (if any)
				break;
			}

			if (firstTypeWasCOAT)
			{
				if (!specularTime) 
				{
					if (sampleLight)
						accumCol = mask * intersections.emission;
					
					// start back at the coated surface, but this time follow reflective branch
					r = firstRay;
					r.direction = normalize(r.direction);
					mask = firstMask;

					// set/reset variables
					specularTime = true;
					bounceIsSpecular = true;
					sampleLight = false;

					// continue with the reflection ray
					continue;
				}
				
				accumCol += mask * intersections.emission; // add reflective result to the refractive result (if any)
				break;	
			}

			accumCol = mask * intersections.emission; // looking at light through a reflection
			// reached a light, so we can exit
			break;
		} // end if (intersections.type == LIGHT)


		if (intersectionType == 'SPOT_LIGHT')
		{	
			if (bounces == 0)
			{
				accumCol = mask * clamp(intersections.emission, 0.0, 1.0);
				break;
			}

			if (firstTypeWasDIFF)
			{
				if (!shadowTime) 
				{
					// start back at the diffuse surface, but this time follow shadow ray branch
					r = firstRay;
					r.direction = normalize(r.direction);
					mask = firstMask;

					// set/reset variables
					shadowTime = true;
					bounceIsSpecular = false;
					sampleLight = true;

					// continue with the shadow ray
					continue;
				}

				accumCol += mask * intersections.emission * 0.5;
				
				break;
			}

			if (firstTypeWasREFR)
			{
				if (!reflectionTime) 
				{
					if (sampleLight)
						accumCol = mask * intersections.emission;
					else if (bounceIsSpecular)
						accumCol = mask * clamp(intersections.emission, 0.0, 1.0);
					
					// start back at the refractive surface, but this time follow reflective branch
					r = firstRay;
					r.direction = normalize(r.direction);
					mask = firstMask;

					// set/reset variables
					reflectionTime = true;
					bounceIsSpecular = true;
					sampleLight = false;

					// continue with the reflection ray
					continue;
				}
				else if (sampleLight)
				{
					accumCol += mask * intersections.emission; // add reflective result to the refractive result (if any)
					break;
				}	
				else if (bounceIsSpecular)
				{
					accumCol += mask * clamp(intersections.emission, 0.0, 1.0);
					break;
				}
			}

			if (firstTypeWasCOAT)
			{
				if (!specularTime) 
				{
					if (sampleLight)
						accumCol = mask * intersections.emission;
					
					// start back at the coated surface, but this time follow reflective branch
					r = firstRay;
					r.direction = normalize(r.direction);
					mask = firstMask;

					// set/reset variables
					specularTime = true;
					bounceIsSpecular = true;
					sampleLight = false;

					// continue with the reflection ray
					continue;
				}
				
				accumCol += mask * intersections.emission; // add reflective result to the refractive result (if any)
				break;	
			}

			accumCol = mask * clamp(intersections.emission, 0.0, 1.0); // looking at light through a reflection
			// reached a light, so we can exit
			break;
		} // end if (intersections.type == SPOTLIGHT)

		
		// if we get here and sampleLight is still true, shadow ray failed to find a light source
		if (sampleLight) 
		{
			if (firstTypeWasDIFF && !shadowTime) 
			{
				// start back at the diffuse surface, but this time follow shadow ray branch
				r = firstRay;
				r.direction = normalize(r.direction);
				mask = firstMask;

				// set/reset variables
				shadowTime = true;
				bounceIsSpecular = false;
				sampleLight = true;

				// continue with the shadow ray
				continue;
			}

			if (firstTypeWasREFR && !reflectionTime) 
			{
				// start back at the refractive surface, but this time follow reflective branch
				r = firstRay;
				r.direction = normalize(r.direction);
				mask = firstMask;

				// set/reset variables
				reflectionTime = true;
				bounceIsSpecular = true;
				sampleLight = false;

				// continue with the reflection ray
				continue;
			}

			if (firstTypeWasCOAT && !specularTime) 
			{
				// start back at the coated surface, but this time follow reflective branch
				r = firstRay;
				r.direction = normalize(r.direction);
				mask = firstMask;

				// set/reset variables
				specularTime = true;
				bounceIsSpecular = true;
				sampleLight = false;

				// continue with the reflection ray
				continue;
			}

			// nothing left to calculate, so exit	
			break;
		}
		
		
		// useful data 
		n = normalize(intersections.normal);
		nl = dot(n, r.direction) < 0.0 ? normalize(n) : normalize(-n);

		x = r.origin + r.direction * t;


		if (intersectionType == 'PBR')
		{
			vec3 S = normalize( cross( abs(nl.y) < 0.9 ? vec3(0, 1, 0) : vec3(0, 0, 1), nl ) );
			vec3 T = cross(nl, S);
			vec3 N = normalize( nl );
			
			// invert S, T when the UV direction is backwards (from mirrored faces),
			// otherwise it will do the normal mapping backwards.
			/* vec3 NfromST = cross( S, T );
			if( dot( NfromST, N ) < 0.0 )
			{
				S *= -1.0;
				T *= -1.0;
			} */

			mat3 tsn = mat3( S, T, N );
			vec3 mapN = texture(tNormalMap, intersections.uv).xyz * 2.0 + 1.0;
			vec2 normalScale = vec2(1.0, 1.0);
			mapN.xy *= normalScale;
			nl = normalize( tsn * mapN );

			intersections.color = texture(tAlbedoMap, intersections.uv).rgb;
			intersections.color = pow(intersections.color,vec3(2.2));
			
			intersections.emission = texture(tEmissiveMap, intersections.uv).rgb;
			intersections.emission = pow(intersections.emission,vec3(2.2));
			
			float maxEmission = max(intersections.emission.r, max(intersections.emission.g, intersections.emission.b));

			if (maxEmission > 0.01) //if (rand(seed) < maxEmission)
			{
				accumCol = mask * intersections.emission;
				break;
			}

			intersectionType = 'COAT';

			metallicRoughness = texture(tMetallicRoughnessMap, intersections.uv).rgb;

			if (metallicRoughness.b > 0.0)
				intersectionType = 'SPEC';
		}

		
		if (intersectionType == 'DIFF') // Ideal DIFFUSE reflection
		{
			previousIntersecType = 'DIFF';
			diffuseCount++;
			
			mask *= intersections.color;

			bounceIsSpecular = false;

			if (diffuseCount == 1 && !firstTypeWasDIFF && !firstTypeWasREFR && !firstTypeWasCOAT)
			{	
				// save intersection data for future shadowray trace
				firstTypeWasDIFF = true;
				dirToLight = sampleSphereLight(x, nl, light, dirToLight, weight, seed);
				firstMask = mask * weight;
				firstRay = Ray( x, normalize(dirToLight) ); // create shadow ray pointed towards light
				firstRay.origin += nl * uEPS_intersect;

				// choose random Diffuse sample vector
				r = Ray( x, normalize(randomCosWeightedDirectionInHemisphere(nl, seed)) );
				r.origin += nl * uEPS_intersect;
				continue;
			}
			else if (firstTypeWasREFR && rand(seed) < diffuseColorBleeding)
			{
				// choose random Diffuse sample vector
				r = Ray( x, normalize(randomCosWeightedDirectionInHemisphere(nl, seed)) );
				r.origin += nl * uEPS_intersect;
				continue;
			}
						
			dirToLight = sampleSphereLight(x, nl, light, dirToLight, weight, seed);
			mask *= weight;

			sampleSunLight = true;

			r = Ray( x, normalize(dirToLight) );
			r.origin += nl * uEPS_intersect;
			sampleLight = true;

			continue;  
		} // end if (intersections.type == DIFF)
		

		if (intersectionType == 'SPEC')  // Ideal SPECULAR reflection
		{
			previousIntersecType = 'SPEC';
			mask *= intersections.color;

			vec3 reflectVec = reflect(r.direction, nl);
			vec3 glossyVec = randomDirectionInHemisphere(nl, seed);
			r = Ray( x, mix(reflectVec, glossyVec, metallicRoughness.g) );
			r.direction = normalize(r.direction);
			r.origin += nl * uEPS_intersect;
			
			//bounceIsSpecular = true;
			continue;
		}


		if (intersectionType == 'REFR')  // Ideal dielectric REFRACTION
		{
			previousIntersecType = 'REFR';
			nc = 1.0; // IOR of Air
			nt = 1.5; // IOR of common Glass
			Re = _this.calcFresnelReflectance(r.direction, n, nc, nt, ratioIoR);
			Tr = 1.0 - Re;

			if (Re > 0.99)
			{
				r = Ray( x, reflect(r.direction, nl) ); // reflect ray from surface
				r.origin += nl * uEPS_intersect;
				continue;
			}
			
			if (bounces < 2 && !firstTypeWasREFR && !firstTypeWasDIFF && !firstTypeWasCOAT)
			{	
				// save intersection data for future reflection trace
				firstTypeWasREFR = true;
				firstMask = mask * Re;
				firstRay = Ray( x, reflect(r.direction, nl) ); // create reflection ray from surface
				firstRay.origin += nl * uEPS_intersect;
				mask *= Tr;
			}

			// transmit ray through surface
			mask *= intersections.color;
			
			tdir = refract(r.direction, nl, ratioIoR);
			r = Ray(x, normalize(tdir));
			r.origin -= nl * uEPS_intersect;
			
			continue;
		} // end if (intersections.type == REFR)
		

		if (intersectionType == 'COAT')  // Diffuse object underneath with ClearCoat on top
		{
			nc = 1.0; // IOR of Air
			nt = 1.4; // IOR of Clear Coat
			Re = calcFresnelReflectance(r.direction, n, nc, nt, ratioIoR);
			Tr = 1.0 - Re;

			if (Re > 0.99)
			{
				r = Ray( x, reflect(r.direction, nl) ); // reflect ray from surface
				r.origin += nl * uEPS_intersect;
				continue;
			}

			if (bounces < 2 && !firstTypeWasCOAT && !firstTypeWasDIFF && !firstTypeWasREFR)
			{	
				// save intersection data for future reflection trace
				firstTypeWasCOAT = true;
				firstMask = mask * Re;
				firstRay = Ray( x, reflect(r.direction, nl) ); // create reflection ray from surface
				firstRay.origin += nl * uEPS_intersect;
				mask *= Tr;
			}
			else if (rand(seed) < Re)
			{
				r = Ray( x, reflect(r.direction, nl) ); // reflect ray from surface
				r.origin += nl * uEPS_intersect;
				continue;
			}

			diffuseCount++;

			mask *= intersections.color;
			
			bounceIsSpecular = false;

			if (diffuseCount == 1 && firstTypeWasCOAT && rand(seed) < diffuseColorBleeding)
			{
				// choose random Diffuse sample vector
				r = Ray( x, normalize(randomCosWeightedDirectionInHemisphere(nl, seed)) );
				r.origin += nl * uEPS_intersect;
				continue;
			}
						
			dirToLight = sampleSphereLight(x, nl, light, dirToLight, weight, seed);
			mask *= weight;
			
			r = Ray( x, normalize(dirToLight) );
			r.origin += nl * uEPS_intersect;

			sampleLight = true;
			continue;
						
		} //end if (intersections.type == COAT)
	}
};
