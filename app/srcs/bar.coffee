# @Author: Guillaume de Matos <schlipak>
# @Date:   18-Aug-2016
# @Email:  g.de.matos@free.fr
# @Last modified by:   schlipak
# @Last modified time: 20-Aug-2016

module.exports = class Bar
  @computeColor: (value, hue, range, lightOffset) ->
    col = tinycolor('hsl(0, 100%, 50%)').toHsl()
    col.h = (hue + (range * (value / 255))) % 360
    light = Math.min(((value / 255) * 100) + lightOffset, 100)
    # God dammit TinyColor!
    if light < 1 then light += 1.0
    if light == 1 then light = 1.1
    col.l = light
    return new THREE.Color(tinycolor(col).toHslString())

  constructor: (scene, @index) ->
    @material = new THREE.MeshLambertMaterial(color: 0xFFFFFF)
    @mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), @material)
    @mesh.position.set(((@index - 50) * 4), 0, 0)
    scene.add(@mesh)

  update: (height, hue, range, lightOffset) ->
    scale = Math.abs(height) / 10.0
    if scale < 0.1 then scale = 0.0001
    @mesh.scale.y = scale
    @mesh.scale.z = scale
    @mesh.material.color = Bar.computeColor(height, hue, range, lightOffset)
