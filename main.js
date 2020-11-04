function main() {
  const canvas = document.querySelector('#glCanvas');
  // Initialize the GL context
  const gl = canvas && canvas.getContext('webgl');
  if (!gl) {
    console.error('Unable to initialize WebGL.');
    return;
  }
  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);
}
main();
