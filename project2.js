// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	// [TO-DO] Modify the code below to form the transformation matrix.
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
	var sin_Z = Math.sin(rotationZ);
	var cos_Z = Math.cos(rotationZ);

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

	var rotZ = [
		cos_Z, sin_Z, 0, 0,
		-sin_Z, cos_Z, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];

	var mvp = MatrixMult(
		projectionMatrix, MatrixMult(
			trans, MatrixMult(
				rotY, rotX
			)
		)
	);
	return mvp;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	//RUNS ONCE after webGL is ready, setup every thing only has to be done once
	//shaders
	//buffers
	//uniforms
	constructor() {
		// [TO-DO] initializations

		this.vertBuffer = gl.createBuffer();
		this.texBuffer = gl.createBuffer();
	}

	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh(vertPos, texCoords) {
		// [TO-DO] Update the contents of the vertex buffer objects.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3; // (# of vertexes / 3) = # of triangles
	}

	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ(swap) {
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		// [TO-DO] Complete the WebGL initializations before drawing

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		// [TO-DO] Bind the texture

		// You can set the texture image data using the following command.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
	}

	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture(show) {
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
	}

}
