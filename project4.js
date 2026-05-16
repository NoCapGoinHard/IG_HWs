var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diff
	vec3  k_s;	// spec
	float n;	// spec exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights[ NUM_LIGHTS ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hitRecord, Ray ray );

// Computes the Blinn-Phong shading for a specific point
vec3 Shade( Material mat, vec3 pos, vec3 norm, vec3 viewDir )
{
	vec3 finalColor = vec3(0.0);
	
	for ( int i = 0; i < NUM_LIGHTS; ++i ) {
		// Shadow ray with INWARD offset: place the ray origin slightly INSIDE
		// the surface we're on. This fix handles both rendering modes uniformly:
		//   - Self-check on our own sphere: smaller root is negative (entry is
		//     behind us), so it's correctly rejected.
		//   - Floor point under a tangent sphere: the inward offset moves us
		//     DOWN into the floor, OUTSIDE the small sphere above, so the
		//     smaller root correctly detects the shadow.
		//   - Secondary mode (rasterized positions): even when the rasterized
		//     point is significantly inside the analytical sphere due to chord
		//     interpolation error, the smaller root is still negative for the
		//     self-check, so we don't get spurious self-shadowing.
		//
		// The shadow ray direction is also normalized so that t-values are in
		// real distance units, avoiding the bright-ring artifact caused by tiny
		// t-values falling below the intersection threshold.
		Ray sRay;
		sRay.pos = pos - 0.001 * norm;
		vec3 toLight = lights[i].position - sRay.pos;
		float lightDist = length( toLight );
		sRay.dir = toLight / lightDist;
		
		HitInfo sHit;
		if ( IntersectRay( sHit, sRay ) && sHit.t < lightDist ) {
			continue; // Obstructed by another object
		}

		// Shading calculation
		vec3 L = normalize( lights[i].position - pos ); 
		float nDotL = dot( norm, L );

		if ( nDotL > 0.0 ) {		
			vec3 diffTerm = mat.k_d * nDotL;	
			vec3 H = normalize( L + viewDir );	

			float nDotH = dot( norm, H );
			if ( nDotH > 0.0 ) {
				diffTerm += mat.k_s * pow( nDotH, mat.n );	
			}
			finalColor += diffTerm * lights[i].intensity;
		}
	}
	return finalColor;
}

bool IntersectRay( inout HitInfo hitRecord, Ray r )
{
	hitRecord.t = 1e30;
	bool isHit = false;
	
	for ( int i = 0; i < NUM_SPHERES; ++i ) {
		vec3 dist = r.pos - spheres[i].center;

		float A = dot( r.dir, r.dir );
		float B = 2.0 * dot( dist, r.dir );
		float C = dot( dist, dist ) - (spheres[i].radius * spheres[i].radius);

		float delta = (B * B) - (4.0 * A * C);

		if ( delta > 0.0 ) {
			float tVal = (-B - sqrt(delta)) / (2.0 * A);

			if ( tVal > 0.0001 && tVal < hitRecord.t ) {
				hitRecord.t = tVal;
				hitRecord.position = r.pos + (tVal * r.dir);
				hitRecord.normal = normalize( hitRecord.position - spheres[i].center );
				hitRecord.mtl = spheres[i].mtl;
				isHit = true;
			}
		}
	}
	return isHit;
}

vec4 RayTracer( Ray initialRay )
{
	HitInfo currentHit;
	
	if ( IntersectRay( currentHit, initialRay ) ) {
		vec3 V = normalize( -initialRay.dir );
		vec3 accumulatedColor = Shade( currentHit.mtl, currentHit.position, currentHit.normal, V );
		
		vec3 currentKs = currentHit.mtl.k_s;
		
		for ( int b = 0; b < MAX_BOUNCES; ++b ) {
			if ( b >= bounceLimit ) {
			    break;
			}
			if ( currentHit.mtl.k_s.x + currentHit.mtl.k_s.y + currentHit.mtl.k_s.z <= 0.0 ) {
			    break;
			}
			
			Ray reflRay;	
			HitInfo reflHit;	
			
			reflRay.pos = currentHit.position + 1e-3 * currentHit.normal; 
			reflRay.dir = reflect( -V, currentHit.normal );
			
			if ( IntersectRay( reflHit, reflRay ) ) {
				V = normalize( -reflRay.dir );
				accumulatedColor += currentKs * Shade( reflHit.mtl, reflHit.position, reflHit.normal, V);

				currentKs *= reflHit.mtl.k_s;
				currentHit = reflHit;
			} else {
				accumulatedColor += currentKs * textureCube( envMap, reflRay.dir.xzy ).rgb;
				break;
			}
		}
		return vec4( accumulatedColor, 1.0 );	
	} 
	
	return vec4( textureCube( envMap, initialRay.dir.xzy ).rgb, 0.0 );	
}
`;