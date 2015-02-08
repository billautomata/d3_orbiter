console.log('start')



var svg = d3.select('body').append('svg')
var g_parent

svg.attr('width', window.innerWidth)
svg.attr('height', window.innerHeight)

svg.style('background-color', d3.rgb(200,200,200))

var velocity_scale = d3.scale.linear().domain([1,25]).range([1,0.5]).clamp(true)

var random = d3.random.normal(0)

var n_planets = 12
var planets = []
var ship

var line = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate("basis");

function setup(){

  for(var i = 0; i < n_planets; i++){
    planets.push({
      pos: new toxi.geom.Vec2D(random()*300, random()*300),
      vel: new toxi.geom.Vec2D(0, 0),
      mass: Math.abs(random() * 20) + 10
    })
  }

  console.table(planets)

  ship = {
    pos: new toxi.geom.Vec2D(random()*100, random()*100),
    vel: new toxi.geom.Vec2D(0, 0),
    mass: Math.abs(random() * 20) + 10
  }


  g_parent = svg.append('g')
    .attr('transform', 'translate('+(window.innerWidth*0.5)+','+(window.innerHeight*0.5)+')')

  // create planets
  planets.forEach(function(planet){

    var g_local = g_parent.append('g')
      .attr('transform', 'translate('+(planet.pos.x)+','+(planet.pos.y)+')')

    g_local.append('line')
      .attr('x0',0).attr('y0',0)
      .attr('x1',0).attr('y1',0)
      .attr('fill', 'none')
      .attr('stroke', 'blue')
      .attr('stroke-width', 10)
      .attr('stroke-opacity', 0.3)

    var circle = g_local.append('circle')

    circle.attr('cx', 0).attr('cy', 0).attr('r', planet.mass)
    circle.attr('fill', 'none').attr('stroke', 'black')

    planet.element = g_local

  })

  // create ship
  var g_ship_parent = g_parent.append('g')
    .attr('transform', 'translate('+(ship.pos.x)+','+(ship.pos.y)+')')

  g_ship_parent.append('line')
    .attr('x0',0).attr('y0',0)
    .attr('x1',0).attr('y1',0)
    .attr('fill', 'none')
    .attr('stroke', 'green')
    .attr('stroke-width', 10)
    .attr('stroke-opacity', 0.3)

  g_ship_parent.append('path').attr('stroke', 'orange')
    .attr('fill', 'none')
    .attr('stroke-width', 10)
    .attr('stroke-opacity', 0.3)


  var circle_ship = g_ship_parent.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', 5)
    .attr('fill', 'blue').attr('stroke', 'black')

  ship.element = g_ship_parent

}


// create ship

function tick(){

  var force = new toxi.geom.Vec2D()

  planets.forEach(function(planet){

    // console.log(ship.pos)
    var distance = planet.pos.distanceTo(ship.pos)
    // console.log(distance, planet.pos.distanceTo(new toxi.geom.Vec2D()))


    var this_force = planet.pos.copy()
    this_force.x -= ship.pos.x
    this_force.y -= ship.pos.y

    this_force.normalizeTo((-planet.mass*10000)/(distance*distance))

    force.x += this_force.x
    force.y += this_force.y

    planet.element.select('line')
      .attr('x1', this_force.x)
      .attr('y1', this_force.y)

  })

  force.normalizeTo(1)

  ship.vel.x -= force.x
  ship.vel.y -= force.y

  ship.pos.addSelf(ship.vel)
  ship.element.attr('transform', 'translate('+(ship.pos.x)+','+(ship.pos.y)+')')
  ship.element.select('line').attr('x1', ship.vel.x*5).attr('y1',ship.vel.y*5)


  ship.element.select('path').attr('d', line(step_particles(30).positions))

  g_parent.attr('transform', 'translate('+(window.innerWidth*0.5-ship.pos.x)+','+(window.innerHeight*0.5-ship.pos.y)+') ')




  window.requestAnimationFrame(tick)
}


setup()
tick()

function predict_future(){


  var n_steps = 12




}


function step_particles(n){

  var temp_ship = {
    pos: new toxi.geom.Vec2D(ship.pos.x, ship.pos.y),
    vel: new toxi.geom.Vec2D(ship.vel.x, ship.vel.y),
    positions: [new toxi.geom.Vec2D()]
  }

  for(var i = 0; i < n; i++){

    var force = new toxi.geom.Vec2D()

    planets.forEach(function(planet){

      // console.log(ship.pos)
      var distance = planet.pos.distanceTo(ship.pos)
      // console.log(distance, planet.pos.distanceTo(new toxi.geom.Vec2D()))


      var this_force = planet.pos.copy()
      this_force.x -= ship.pos.x
      this_force.y -= ship.pos.y

      this_force.normalizeTo((-planet.mass*10000)/(distance*distance))

      force.x += this_force.x
      force.y += this_force.y

      planet.element.select('line')
        .attr('x1', this_force.x)
        .attr('y1', this_force.y)

    })

    force.normalizeTo(1)

    temp_ship.vel.x -= force.x
    temp_ship.vel.y -= force.y

    temp_ship.pos.addSelf(temp_ship.vel)
    temp_ship.positions.push(new toxi.geom.Vec2D(temp_ship.pos.x-ship.pos.x, temp_ship.pos.y-ship.pos.y))

  }

  return temp_ship

}
