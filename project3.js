// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html (((5?))) to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	var trans = [
		1, 0, 0, 0, //column 1
		0, 1, 0, 0, //column 2
		0, 0, 1, 0, //column 3
		translationX, translationY, translationZ, 1 //column 4
	];

	//change of vars to simplify
	var sin_X = Math.sin(rotationX);
	var cos_X = Math.cos(rotationX);
	var sin_Y = Math.sin(rotationY);
	var cos_Y = Math.cos(rotationY);

	//robotics 1 but column major notation
	//4x4 because you'll have to merge it with transl matrix

	var rotX = [
		1, 0, 0, 0,
		0, cos_X, sin_X, 0,
		0, -sin_X, cos_X, 0,
		0, 0, 0, 1
	];

	var rotY = [
		cos_Y, 0, -sin_Y, 0,
		0, 1, 0, 0,
		sin_Y, 0, cos_Y, 0,
		0, 0, 0, 1
	];

	var mvp = MatrixMult(
		trans, MatrixMult(
			rotY, rotX
		)
	);
	return mvp;
}

var meshVS = `
	attribute vec3 pos;
	uniform mat4 mvp;
	uniform bool swapYZ;
	attribute vec2 texCoord;
	varying vec2 vTexCoord;

	void main() {
		vec3 p = pos;
		vTexCoord = texCoord;
		if (swapYZ) {
			p = vec3(p.x, p.z, p.y);
		}

		gl_Position = mvp * vec4(p, 1);
	}
`;

var meshFS = `
	precision mediump float;
	uniform bool showTex;
	uniform sampler2D tex;
	varying vec2 vTexCoord;

	void main() {
		if (showTex) {
			gl_FragColor = texture2D(tex, vTexCoord);
		} else {
			gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
		}
	}
`;

// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		// [TO-DO] initializations
		this.prog = InitShaderProgram(meshVS, meshFS); //compiling + linking shaders into prog

		//UNIFORM LOCATIONS (-->gpu)
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp')
		this.posLoc = gl.getAttribLocation(this.prog, 'pos');
		this.swapYZLoc = gl.getUniformLocation(this.prog, 'swapYZ');

		this.vertBuffer = gl.createBuffer();
		this.numTriangles = 0;

		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
		this.texLoc = gl.getUniformLocation(this.prog, 'tex');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');

		this.texBuffer = gl.createBuffer();

		this.texture = gl.createTexture();
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals ) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap ) {
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram(this.prog);
		gl.uniform1i(this.swapYZLoc, swap ? 1 : 0); //this means "if swap is == 1 then 1 else 0"
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvpLoc, false, matrixMVP);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.posLoc);
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoordLoc);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(this.texLoc, 0);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		
		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); //tried some but REPEAT is the one that makes the texture appear
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); // identical to the youtube video
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, 1);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show ) {
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show ? 1 : 0); //same behaviour as swapYZ variable remember
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
	}
}
