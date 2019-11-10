			
function test()
{
	varying vec4 vPosition;
	varying vec3 vViewPosition;
	varying vec4 vNormal;
	varying vec3 vViewNormal;

	//varying vec2 vUv;
	void main()	
	{
		vViewPosition = (modelViewMatrix * vec4(position,1.0)).xyz;
		vNormal = vec4(normal.xyz, 0.0);
		vViewNormal = normalMatrix * normal.xyz;
		vPosition = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		//vUv = uv;
		gl_Position = vPosition;
	}

	uniform vec3 u_lightColor;
	uniform vec3 u_lightDir;
	uniform vec3 u_lightPos;

	uniform vec3 u_viewPos;
	uniform vec3 u_diffuseColor;
	uniform float u_roughness;
	uniform float u_fresnel;
	uniform float u_alpha;
	uniform vec3 u_ambientColor;
	uniform samplerCube u_tCube;
	uniform float u_time;
	varying vec4 vPosition;
	varying vec3 vViewPosition;
	varying vec4 vNormal;
	varying vec3 vViewNormal;
	varying vec2 vUv;

	const M_PI 3.1415926535897932384626433832795

	function dotClamped(vec3 a, vec3 b) // return float
	{
		return Math.max(a.dot(b), 0.0);
	}
	function fresnelSchlick(float f0, vec3 l, vec3 h)  // return float
	{
		float LoH = l.dot(h);
		float powTerm = (-5.55473 * LoH - 6.98316) * LoH;
		return f0 + (1.0 - f0) * pow(2.0, powTerm);
		//return f0 + (1.0-f0) * pow(1.0-l.dot(h),5.0);
	}
	function NDFGGX(float a, vec3 n, vec3 h, float NoH)  // return float
	{
		float a2 = a*a;
		return a2 / (4.0 * pow(pow(NoH, 2.0) * (a2 - 1.0) + 1.0, 2.0));
	}
	function GCookTorrance(float a, vec3 l, vec3 v, vec3 h, vec3 n, float NoL, float NoV)  // return float
	{
		float VdotH = max(v.dot(h), 0.0);
		float NdotH = max(n.dot(h), 0.0);
		float minV = 2.0 * NdotH * min(NoV, NoL) / VdotH;
		return min(1.0, minV);
	}
	function random(vec3 scale, float seed)  // return float
	{
		return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
	}
	function RandomSamples(float seed)  // return vec2
	{
		float u = random(vec3(12.9898, 78.233, 151.7182), seed);
		float v = random(vec3(63.7264, 10.873, 623.6736), seed);
		return vec2(u, v);
	}
	function ImportanceSampleGGX( vec2 Xi, float Roughness, vec3 N )  // return vec3
	{
		float a = Roughness * Roughness;
		float Phi = 2.0 * M_PI * Xi.x;
		float CosTheta = sqrt( (1.0 - Xi.y) / ( 1.0 + (a*a - 1.0) * Xi.y ) );
		float SinTheta = sqrt( 1.0 - CosTheta * CosTheta );
		vec3 H;
		H.x = SinTheta * cos( Phi );
		H.y = SinTheta * sin( Phi );
		H.z = CosTheta;
		return H;
	}
	function SpecularIBL( float Roughness, vec3 NL, vec3 V, float fresnel) // return vec3
	{
		//L: viewLightDir
		//H: halfVector
		//V: viewNormal
		//V: viewDir
		vec3 SpecularLighting = vec3(0.0);
		let NumSamples = 32;
		for( let i = 0; i < NumSamples; i++ )
		{
			vec2 Xi = RandomSamples( u_time + float(i) );
			vec3 H = ImportanceSampleGGX( Xi, Roughness, NL );
			vec3 L = 2.0 * V.dot( H ) * H - V;
			float NoV = max( NL.dot( V ), 0.0 );
			float NoL = max( NL.dot( L ), 0.0 );
			float NoH = max( NL.dot( H ), 0.0 );
			float VoH = max( V.dot( H ), 0.0 );
			
			if( NoL > 0.0 )
			{
				vec3 SampleColor = textureCube (u_tCube, L).xyz;
				float fresnel_fn = fresnelSchlick(fresnel, L, H);
				/*Put M_PI/4.0 in to NDF functions*/
				float ndf_fn = NDFGGX(Roughness, NL, H, NoH);
				/*Put /(NoL*NoV) in G funtion*/
				float g_fn = GCookTorrance(Roughness, L, V, H, NL, NoL, NoV);
				SpecularLighting += fresnel_fn * ndf_fn * g_fn * SampleColor;
			}
		}
		return SpecularLighting / float(NumSamples);
	}

	vec3 dirDiffuse = vec3(0.0);
	vec3 dirSpecular = vec3(0.0);

	function calDirLight(vec3 lDir, vec3 normal, vec3 diffuse, vec3 specular) 
	{
		vec3 dirLightColor = vec3(1.0);
		vec4 lDirection = viewMatrix * vec4( lDir, 0.0 );
		vec3 dirVector = normalize( lDirection.xyz );
		float dirDiffuseWeight = max(dot( normal, dirVector ), 0.0);
		dirDiffuse += diffuse * dirLightColor * dirDiffuseWeight * 0.5;
		vec3 dirHalfVector = normalize( dirVector + vViewPosition );
		float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );
		float dirSpecularWeight = 0.5 * max( pow( dirDotNormalHalf, 0.0 ), 0.0 );
		float specularNormalization = ( 0.0 + 2.0 ) / 8.0;
		vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( dirVector, dirHalfVector ), 0.0 ), 5.0 );
		dirSpecular += schlick * dirLightColor * dirSpecularWeight * dirDiffuseWeight * specularNormalization;
	}
	function main()	
	{
	//		viewMatrix
	//		cameraPosition
		vec3 viewPosition = normalize(vViewPosition);
		vec4 viewLightPos = viewMatrix * vec4( u_lightPos, 1.0 );
		vec3 viewLightDir = viewLightPos.xyz - viewPosition.xyz;
		viewLightDir = normalize(viewLightDir);
		vec3 normal = normalize(vNormal.xyz);
		vec3 viewNormal = normalize(vViewNormal.xyz);
		vec3 viewDir = normalize(-vViewPosition);
		vec3 halfVec = normalize(viewDir + viewLightDir);
		float diffuse = max(dot(normalize(-u_lightDir), normal), 0.0);
		float NoL= max(dot(viewNormal, viewLightDir), 0.0);

		float fresnel = pow((1.0 - u_fresnel) / (1.0 + u_fresnel), 2.0);
		float fresnel_fn = fresnelSchlick(fresnel, viewLightDir, halfVec);
		vec3 specularColor = SpecularIBL(u_alpha, viewNormal, viewDir, fresnel);

		vec3 specColor = specularColor * NoL + dirSpecular;
		vec3 diffuseColor = u_diffuseColor * diffuse * (1.0 - fresnel_fn) * u_lightColor + dirDiffuse;
		gl_FragColor = vec4( diffuseColor + specColor + u_ambientColor * u_diffuseColor, 1.0);
	}
}

		