console.log('start')

var n_to_check = 4
var n_steps = 32
var gravity_multi = 1000

var svg = d3.select('body').append('svg')
var g_parent
var g_scale_parent
var g_ship_stats

svg.attr('width', window.innerWidth)
svg.attr('height', window.innerHeight)

svg.style('background-color', d3.rgb(200,200,200))

var velocity_scale = d3.scale.linear().domain([1,25]).range([1,0.5]).clamp(true)

var random = d3.random.normal(0)

var n_planets = 6
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
    vel: new toxi.geom.Vec2D(random() * 10, random() * 10),
    mass: Math.abs(random() * 20) + 10
  }

  g_parent = svg.append('g')
    .attr('transform', 'translate('+(window.innerWidth*0.5)+','+(window.innerHeight*0.5)+')')


  g_scale_parent = g_parent.append('g')
    .attr('transform', 'scale(0.5, 0.5)')

  // create planets
  planets.forEach(function(planet){

    var g_local = g_scale_parent.append('g')
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
  var g_ship_parent = g_scale_parent.append('g')
    .attr('transform', 'translate('+(ship.pos.x)+','+(ship.pos.y)+')')

    g_ship_parent.append('path').attr('stroke', 'orange')
      .attr('id', 'main')
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 1)


    for(var i = 0; i < n_to_check; i++){

      g_ship_parent.append('path').attr('stroke', 'red')
        .attr('id', '_id'+i)
        .attr('fill', 'none')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.3)


    }

    g_ship_parent.append('line')
      .attr('x0',0).attr('y0',0)
      .attr('x1',0).attr('y1',0)
      .attr('fill', 'none')
      .attr('stroke', 'green')
      .attr('stroke-width', 10)
      .attr('stroke-opacity', 1)

  var circle_ship = g_ship_parent.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', 5)
    .attr('fill', 'blue').attr('stroke', 'black')

  ship.element = g_ship_parent


  // debug views
  g_ship_stats = svg.append('g').attr('transform', 'translate(10,10)')
  g_ship_stats.append('text').attr('id','vx').text('vel stats')
  g_ship_stats.append('text')
    .attr('transform', 'translate(0,20)')
  .attr('id','vy').text('vel stats')


}

function tick(){

  predict_future()


  var force = new toxi.geom.Vec2D()

  planets.forEach(function(planet){

    // console.log(ship.pos)
    var distance = planet.pos.distanceTo(ship.pos)



    if(distance < planet.mass*2.0){
      if(planet.found !== true){
        planet.found = true
        planet.element.select('circle').attr('fill', 'green')
      }
    }
    // console.log(distance, planet.pos.distanceTo(new toxi.geom.Vec2D()))


    var this_force = planet.pos.copy()
    this_force.x -= ship.pos.x
    this_force.y -= ship.pos.y

    this_force.normalizeTo((-planet.mass*gravity_multi)/(distance*distance))

    force.x += this_force.x
    force.y += this_force.y

    planet.element.select('line')
      .attr('x1', this_force.x)
      .attr('y1', this_force.y)

  })

  //force.normalizeTo(10)
  var limit = 10
  if(Math.abs(force.x) > limit || Math.abs(force.y) > limit){
    console.log('here')
    force.x = force.y = 0
  }

  ship.vel.x -= force.x
  ship.vel.y -= force.y

  var damping = 1.00
  ship.vel.x *= damping
  ship.vel.y *= damping

  ship.pos.addSelf(ship.vel)
  ship.element.attr('transform', 'translate('+(ship.pos.x)+','+(ship.pos.y)+')')
  ship.element.select('line').attr('x1', ship.vel.x*5).attr('y1',ship.vel.y*5)

  ship.element.select('path#main').attr('d', line(step_particles(n_steps*2,false).positions))

  // g_parent.attr('transform', 'translate('+(window.innerWidth*0.5-ship.pos.x)+','+(window.innerHeight*0.5-ship.pos.y)+') ')

  g_ship_stats.select('text#vx').html(ship.vel.x.toFixed(1))
  g_ship_stats.select('text#vy').html(ship.vel.y.toFixed(1))



  window.requestAnimationFrame(tick)
}


setup()
tick()

function predict_future(){

  var best_score = Number.MAX_VALUE
  var best_ship

  for(var i = 0; i < n_to_check; i++){

    var check_ship = step_particles(n_steps)

    if(check_ship.score < best_score){
      best_ship = check_ship
      best_score = check_ship.score
    }

    ship.element.select('path#_id'+i).attr('d', line(check_ship.positions))

  }

  //console.log(best_score, best_ship.vel_bump)
  ship.vel.x += best_ship.vel_bump.x
  ship.vel.y += best_ship.vel_bump.y


}


function step_particles(n, dobump){

  var bump_size = 0.5

  var temp_ship = {
    pos: new toxi.geom.Vec2D(ship.pos.x, ship.pos.y),
    vel: new toxi.geom.Vec2D(ship.vel.x, ship.vel.y),
    vel_bump: new toxi.geom.Vec2D(random()*bump_size,random()*bump_size),
    positions: [new toxi.geom.Vec2D()],
    score: 0
  }

  if(dobump !== false){
    temp_ship.vel.x += temp_ship.vel_bump.x
    temp_ship.vel.y += temp_ship.vel_bump.y
  }

  for(var i = 0; i < n; i++){

    var force = new toxi.geom.Vec2D()

    planets.forEach(function(planet){

      // console.log(ship.pos)
      var distance = planet.pos.distanceTo(ship.pos)



      if(distance < planet.mass){
        temp_ship.score = Number.MAX_VALUE*0.5
      } else {
        temp_ship.score+= distance
        if(planet.found !== true){
          temp_ship.score += distance*distance
        }

        if(distance < planet.mass*2.0){
          //temp_ship.score = -1000
        }

      }


      // console.log(distance, planet.pos.distanceTo(new toxi.geom.Vec2D()))


      var this_force = planet.pos.copy()
      this_force.x -= ship.pos.x
      this_force.y -= ship.pos.y

      this_force.normalizeTo((-planet.mass*gravity_multi)/(distance*distance))

      force.x += this_force.x
      force.y += this_force.y

      planet.element.select('line')
        .attr('x1', this_force.x * 100)
        .attr('y1', this_force.y * 100)

    })

    //force.normalizeTo(1)

    temp_ship.vel.x -= force.x
    temp_ship.vel.y -= force.y

    temp_ship.pos.addSelf(temp_ship.vel)
    temp_ship.positions.push(new toxi.geom.Vec2D(temp_ship.pos.x-ship.pos.x, temp_ship.pos.y-ship.pos.y))

  }

  return temp_ship

}
