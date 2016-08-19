# @Author: Guillaume de Matos <schlipak>
# @Date:   18-Aug-2016
# @Email:  g.de.matos@free.fr
# @Last modified by:   schlipak
# @Last modified time: 20-Aug-2016

Bar     = require 'srcs/bar'

module.exports = class Pinnacle3
	_frame = -1

	constructor: (@target, @params) ->
		@width = window.innerWidth
		@height = window.innerHeight
		@bars = new Array
		@lights = new Array
		@radius = 300
		@paused = true
		@hue = ((@params.color && @params.color.hue) || 0)
		@range = ((@params.color && @params.color.range) || 180)
		@lightOffset = ((@params.color && @params.color.lightOffset) || 10)
		@initScene()

	initScene: () ->
		@renderer = new THREE.WebGLRenderer({
			antialias: true
		})
		@renderer.setClearColor(0x1A1A1A, 1)
		@renderer.autoClear = false
		@camera = new THREE.PerspectiveCamera(
			45, @width / @height,
			0.1, 10000
		)
		@scene = new THREE.Scene()
		@scene.add @camera
		@camera.position.x = 0
		@camera.position.y = Math.cos(Math.PI / 4) * @radius
		@camera.position.z = Math.sin(Math.PI / 4) * @radius
		@camera.lookAt @scene.position
		@renderer.setSize @width, @height
		@target.appendChild @renderer.domElement
		for i in [1..99] by 1
			@bars.push new Bar(@scene, i, @params)
		light = new THREE.AmbientLight(0xFFFFFF)
		@scene.add light
		if @params.particles then @setupParticles()
		@setupComposer()
		if @params.mouse then @initMouse()

	setupParticles: () ->
		@particleSystems = []
		for i in [1..4] by 1
			particles = new THREE.Geometry()
			loader = new THREE.TextureLoader()
			col = tinycolor('hsl(0, 100%, 50%)').toHsl()
			col.h = @hue
			mat = new THREE.PointsMaterial({
				color: new THREE.Color(tinycolor(col).toRgbString()),
				size: 8,
				map: loader.load('img/spark.png'),
				blending: THREE.AdditiveBlending,
				transparent: true
			})
			mat.alphaTest = 0.1
			for i in [1..125] by 1
				coords = {
					x: Math.random() * (@radius * 2) - @radius,
					y: Math.random() * (@radius * 2) - @radius
					z: Math.random() * (@radius * 2) - @radius,
				}
				particle = new THREE.Vector3(coords.x, coords.y, coords.z)
				particle.velocity = new THREE.Vector3(0, -Math.random(), 0)
				particles.vertices.push(particle)
			system = new THREE.Points(particles, mat)
			@particleSystems.push(system)
			@scene.add system

	setupComposer: () ->
		@composer = new THREE.EffectComposer(@renderer)
		@composer.addPass(new THREE.RenderPass(@scene, @camera))
		if not @params.shaders or (@params.shaders and @params.shaders.shift)
			effect = new THREE.ShaderPass(THREE.RGBShiftShader)
			effect.uniforms['amount'].value = 0.0012
			@composer.addPass(effect)
		if not @params.shaders or (@params.shaders and @params.shaders.bloom)
			effect = new THREE.BloomPass(.5, 25, 5, 512)
			@composer.addPass(effect)
		if not @params.shaders or (@params.shaders and @params.shaders.unreal)
			effect = new THREE.UnrealBloomPass(512, .3, 1.5, .95)
			@composer.addPass(effect)
		if not @params.shaders or (@params.shaders and @params.shaders.vignette)
			effect = new THREE.ShaderPass(THREE.VignetteShader)
			effect.uniforms["offset"].value = 1
			effect.uniforms["darkness"].value = 1.2
			@composer.addPass(effect)
		effect = new THREE.ShaderPass(THREE.CopyShader)
		effect.renderToScreen = true
		@composer.addPass(effect)
		_this = @
		window.addEventListener('resize', () ->
			_this.width = window.innerWidth
			_this.height = window.innerHeight
			_this.camera.aspect = _this.width / _this.height
			_this.camera.updateProjectionMatrix()
			_this.renderer.setSize _this.width, _this.height
			_this.composer.setSize _this.width, _this.height
		)

	run: (url) ->
		@audio = new Audio(url)
		@audio.crossOrigin = "anonymous"
		@audioCtx = new (window.AudioContext || window.webkitAudioContext)()
		@audioSrc = @audioCtx.createMediaElementSource(@audio)
		@analyser = @audioCtx.createAnalyser()
		@audioSrc.connect(@analyser)
		@audioSrc.connect(@audioCtx.destination)
		@audioData = new Uint8Array(@analyser.frequencyBinCount)
		@play()

	initMouse: () ->
		_this = @
		@renderer.domElement.addEventListener('mousemove', (e) ->
			angles = {
				theta: (Math.PI / 2) + ((e.clientX / _this.width) * (Math.PI / 8)) - (Math.PI / 16),
				phi: (Math.PI / 4) + ((e.clientY / _this.height) * (Math.PI / 8)) - (Math.PI / 16)
			}

			coords = {
				x: _this.radius * Math.sin(angles.phi) * Math.cos(angles.theta),
				y: _this.radius * Math.cos(angles.phi),
				z: _this.radius * Math.sin(angles.phi) * Math.sin(angles.theta)
			}

			_this.camera.position.x = coords.x
			_this.camera.position.y = coords.y
			_this.camera.position.z = coords.z
			_this.camera.lookAt _this.scene.position
		)

	freeze: () ->
		@pause()
		if _frame != -1
			cancelAnimationFrame _frame
			_frame = -1

	thaw: () ->
		if _frame == -1
			_frame = requestAnimationFrame(@animate.bind(this))

	play: () ->
		@audio.play()
		@paused = false
		@target.classList.add 'playing'
		@thaw()

	stop: () ->
		@pause()
		@audio.currentTime = 0

	pause: () ->
		@audio.pause()
		@paused = true
		@target.classList.remove 'playing'

	toggle: () ->
		if @paused
			@play()
		else
			@pause()

	average: (array) ->
		sum = 0;
		for val in array
			sum += val
		return (sum / array.length);

	updateParticles: () ->
		avg = @average(@audioData)
		col = Bar.computeColor(avg, @hue, @range, @lightOffset + 20)
		rotation = .0003 + ((Math.pow(avg, 4) / Math.pow(255, 4)) / 10)
		@particleSystems[0].rotation.y += rotation
		@particleSystems[1].rotation.y += rotation / 2
		@particleSystems[2].rotation.y -= rotation / 2
		@particleSystems[3].rotation.y += rotation
		for system in @particleSystems
			system.material.size = 4 + ((Math.pow(avg, 4) / Math.pow(255, 3)))
			system.material.color = col

	animate: () ->
		@analyser.getByteFrequencyData(@audioData)
		middle = ~~(@bars.length / 2) + 1
		chunkSize = ~~(@audioData.length / middle)
		i = 0
		for bar in @bars
			if i < middle
				idx = middle - i - 1
			else
				idx = i - middle + 1
			freqs = @audioData.slice(chunkSize * idx, chunkSize * (idx + 1))
			avg = @average(freqs)
			bar.update(avg, @hue, @range, @lightOffset)
			i += 1
		if @params.particles then @updateParticles()
		@renderer.clear()
		@composer.render()
		if (@params.color and @params.color.cycle) and (_frame % 15 == 0)
			@hue = (@hue + 1) % 360
		_frame = requestAnimationFrame(@animate.bind(this))
