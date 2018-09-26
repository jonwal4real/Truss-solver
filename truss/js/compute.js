/*
  Computation - main algorithm
*/
var dontApplyAlgo = false;

function stopAlgo() {
  dontApplyAlgo = true;
}

function runAlgo() {
  dontApplyAlgo = false;
  reRunAlgo();
}

function initializeZeroArray(n, m) {
  var r = [];
  if (m) {
    for (var i = 0; i < n; ++i)
      r[i] = initializeZeroArray(m);
  } else {
    for (var i = 0; i < n; ++i)
      r[i] = 0;
  }
  return r;
}

function getOtherNode(member, node) {
  if (member.node1 == node)
    return member.node2;
  else if (member.node2 == node)
    return member.node1;
  else {
    if (confirm("Error -- node not in member?"))
      return;
  }
}

// compute angle emanating from node, as radians CW from EAST
// output in range [-pi, pi]
function memberAngleWithXaxis(member, node) {
  var other = getOtherNode(member, node);
  var dx = other.x - node.x;
  var dy = other.y - node.y;
  return Math.atan2(dy, dx);
}

/**
 * Set changing to true if user is still dragging a node. Slow computations
 * will be skipped, and the displays will be cleared instead.
 */
function reRunAlgo(changing) {
  if (dontApplyAlgo)
    return;

  if (changing)
    clearForceLabels();
  else
    methodOfJoint();
}

function clearForceLabels() {
  _.each(supports, function (support) {
    updateSupportLabel(support, '');
  });
  _.each(members, function (member) {
    updateMemberLabel(member, '', COLORS.memberForceZero);
  });
}

function methodOfJoint() {
  var serialToIndex = {}; // unknown to x_idx
  var indexToSerial = {}; // unknown to x_idx
  var indexToType = {};

  var index = 0;
  _.each(supports, function (support) {
    serialToIndex[support.serial] = index;
    indexToSerial[index] = support.serial;
    indexToType[index] = 'support';

    ++index;
  });
  _.each(members, function (member) {
    serialToIndex[member.serial] = index;
    indexToSerial[index] = member.serial;
    indexToType[index] = 'member';

    ++index;
  });
  var numberOfDims = index;


  // Begin filling matrix and vector
  //
  // matrixA x = vectorB
  // x = inverse(matrixA) vectorB
  var matrixA = [];
  var vectorB = initializeZeroArray(numberOfDims);

  // the next row to populate
  var row = 0;

  _.each(nodes, function (node) {
    var elementXComponents = initializeZeroArray(numberOfDims);
    var elementYComponents = initializeZeroArray(numberOfDims);
    _.each(node.members, function (member) {
      index = serialToIndex[member.serial];
      elementXComponents[index] = Math.cos(memberAngleWithXaxis(member, node));
      elementYComponents[index] = Math.sin(memberAngleWithXaxis(member, node));
    });
    _.each(node.supports, function (support) {
      index = serialToIndex[support.serial];
      if (support.vertical) {
        elementYComponents[index] = -1;
      } else {
        elementXComponents[index] = 1;
      }
    });

    var loadSumX = 0;
    var loadSumY = 0;
    _.each(node.loads, function (load) {
      loadSumX += load.compX;
      loadSumY += load.compY;
    });

    matrixA[row] = elementXComponents;
    vectorB[row] = -loadSumX;
    ++row;

    matrixA[row] = elementYComponents;
    vectorB[row] = -loadSumY;
    ++row;
  });



  // Display equations

  var htmlTableStr = '';
  htmlTableStr += "<table><tr>";
  for (var i = 0; i < numberOfDims; ++i) {
    htmlTableStr += "<td colspan=3>" + indexToType[i] + indexToSerial[i] + "</td>";
    htmlTableStr += "<td colspan=1></td>";
  }
  htmlTableStr += "</tr>";
  for (var r = 0; r < matrixA.length; ++r) {
    htmlTableStr += "<tr>";
    for (var c = 0; c < matrixA[r].length; ++c) {
      if (c != 0)
        htmlTableStr += "<td>+</td>";

      if (Math.abs(matrixA[r][c]) < 1e-5) {
        htmlTableStr += "<td></td>";
        htmlTableStr += "<td></td>";
        htmlTableStr += "<td></td>";
      } else {
        htmlTableStr += "<td>(</td>";
        htmlTableStr += "<td>" + matrixA[r][c].toFixed(4) + "</td>";
        htmlTableStr += "<td>)x<sub>" + (c + 1) + "</sub></td>";
      }
    }
    htmlTableStr += "<td>=</td>";
    htmlTableStr += "<td>" + vectorB[r].toFixed(2) + "</td>";
    htmlTableStr += "</tr>";
  }
  htmlTableStr += "</table><br/>\n";

  $('#partition2').html(htmlTableStr);

  var numberOfEquations = matrixA.length;

  var vectorXvalues;
  var vectorXlabels;
  if (numberOfDims > 0 || numberOfEquations) {

    if (numberOfDims === numberOfEquations) { // || numberOfDims < numberOfEquations) {
      // Ax = b
      vectorXvalues = solveMatrixEquation($M(matrixA), $V(vectorB)).elements;
      vectorXlabels = [];
      for (var i = 0; i < numberOfDims; ++i) {
        vectorXlabels[i] = vectorXvalues[i].toFixed(0) + " N";
      }
    } else {
      if (numberOfDims > numberOfEquations) {
        $('#partition2').append('<p>Externally indeterminant system: more unknowns than equations. Remove members or supports.</p>');
      } else {
        $('#partition2').append('<p>Unstable system: more equations than unknowns. Add more members or supports.</p>');
      }
    }
  }

  if (!vectorXvalues) {
    $('#partition2').append('<p>System of equations cannot be solved</p>');
    vectorXvalues = [];
    vectorXlabels = [];
    for (var i = 0; i < numberOfDims; ++i) {
      vectorXvalues[i] = 0;
      vectorXlabels[i] = '';
    }
  }


  // Display results
  for (var i = 0; i < numberOfDims; ++i) {
    var type = indexToType[i];
    var serial = indexToSerial[i];
    if (type == 'member') {
      var color = COLORS.memberForceZero;
      var EPSILON = 1e-5;
      if (vectorXvalues[i] > EPSILON) {
        color = COLORS.memberForceTension;
      } else if (vectorXvalues[i] < -EPSILON) {
        color = COLORS.memberForceCompression;
      }

      updateMemberLabel(members[serial], vectorXlabels[i], color);
    } else if (type == 'support') {
      updateSupportLabel(supports[serial], vectorXlabels[i]);
    } else {
      if (confirm("???")) return;
    }
  }
}

// Given matrix A, vector b, finds vector x such that Ax = b.
 
function solveMatrixEquation(A, b) {
  var M = A.augment(b);

  // uses row operations to make the matrix upper-triangular
  M = M.toUpperTriangular();

  // Back-substitution for x.
  var x = Vector.Zero(b.dimensions());
  for (var i = M.rows(); i >= 1; --i) {
    var val = M.e(i, M.cols()); // last column is a vector
    var firstNonZeroColumn = null;
    for (var j = 1; j <= M.cols() - 1; ++j) { // exclude last column
      if (!firstNonZeroColumn && M.e(i, j) !== 0) { // FIXME float precision compare
        firstNonZeroColumn = j;
      } else if (firstNonZeroColumn) {
        val -= x.e(j) * M.e(i, j);
      }
    }

    val /= M.e(i, firstNonZeroColumn);
    x.elements[firstNonZeroColumn - 1] = val; // N.B. one-indexed!
  }
  return x;
}

/* 
  Drawing - to display elements on the grid
*/ 
var paper = null;

var PIXELS_PER_UNIT_LOAD = 5;
var SIZES = {
  nodeRadius: 10,
  memberWidth: 5,
  support: 75,
  supportWidth: 3,
  loadWidth: 3,
  loadLabel: 12,
  memberLabel: 12,
  supportLabel: 12,
};
var COLORS = {
  bg: 'white',
  gridMajor: '#B8B4B4',
  gridMinor: '#333',
  member: '#999',
  ghostMember: '#74A5A2',
  nodeFill: 'black',
  nodeStroke: 'black',
  support: '#79f',
  load: '#f00',
  loadForce: '#fff',
  memberForceZero: '#ccc',
  memberForceTension: '#fa8',
  memberForceCompression: '#8af',
  memberLength: '#ff8',
  supportForce: '#fff'
};

function drawGrid() {
  var bg = paper.rect(0, 0, w, h);
  bg.attr({ fill: COLORS.bg });

  var minor = paper.set();
  for (var x = gridspace / 2; x <= w; x += gridspace) {
    minor.push(paper.path('M ' + x + ' 0 V ' + h));
  }
  for (var y = gridspace / 2; y <= h; y += gridspace) {
    minor.push(paper.path('M 0 ' + y + ' H ' + w));
  }
  minor.attr({ stroke: COLORS.gridMinor });

  var major = paper.set();
  for (var x = 0; x <= w; x += gridspace) {
    major.push(paper.path('M ' + x + ' 0 V ' + h));
  }
  for (var y = 0; y <= h; y += gridspace) {
    major.push(paper.path('M 0 ' + y + ' H ' + w));
  }
  major.attr({ stroke: COLORS.gridMajor });

  var overlay = paper.rect(0, 0, w, h);
  overlay.attr({ fill: '#000', 'fill-opacity': 0 });

  bg.click(bgClick);
  overlay.click(bgClick);
}

function createNodeEl(x, y, s) {
  var el = paper.circle(x, y, SIZES.nodeRadius * 0.5);
  el.attr({ fill: COLORS.nodeFill, stroke: COLORS.nodeStroke });
  el.dclSerial = s;
  el.dclType = 'node';
  el.drag(nodeDragMove, nodeDragStart, nodeDragEnd);
  el.click(nodeClick);
  rightClickify(el, nodeClick);

  var set = paper.set();
  set.push(el);
  set.realEl = el;

  return set;
}

function memberPath(node1, node2) {
  return [['M', node1.x, node1.y], ['L', node2.x, node2.y]];
}

function createMemberEl(node1, node2, s) {
  var el = paper.path(memberPath(node1, node2));
  el.attr({
    'stroke-width': SIZES.memberWidth,
    'stroke-linecap': 'round',
    'stroke': COLORS.member
  });
  el.dclSerial = s;
  el.dclType = 'member';

  el.click(memberClick);
  rightClickify(el, memberClick);
  return el;
}

function createSupportEl(node, vertical, s) {
  var el = paper.path([
    ['M', node.x, node.y],
    vertical ? ['l', 0, -SIZES.support] : ['l', SIZES.support, 0]
  ]);
  el.attr({
    'stroke-width': SIZES.supportWidth,
    'stroke': COLORS.support,
    'arrow-end': 'classic-wide-long'
  });
  el.dclSerial = s;
  el.dclType = 'support';

  return el;
}

function humanAngle(angle) {
  angle = Math.abs(angle * 180 / Math.PI);
  if (angle > 90)
    angle = 180 - angle;
  return Math.round(angle) + "\u00B0";
}

function createLoadEls(node, val, angle, s) {
  var dx = Math.cos(angle) * val * PIXELS_PER_UNIT_LOAD;
  var dy = Math.sin(angle) * val * PIXELS_PER_UNIT_LOAD;

  var el = paper.path([
    ['M', node.x, node.y],
    ['l', dx, dy]
  ]);
  el.attr({
    'stroke-width': SIZES.loadWidth,
    'stroke': COLORS.load,
    'arrow-end': 'classic-wide-long'
  });
  var textEl = paper.text(node.x + dx / 2, node.y + dy / 2, val + " N, " + humanAngle(angle));
  textEl.attr({
    'fill': COLORS.loadForce,
    'font-size': SIZES.loadLabel
  });
  textEl = createShadowedSet(textEl);

  el.dclSerial = textEl.dclSerial = s;
  el.dclType = textEl.dclType = 'load';

  el.click(loadClick);
  textEl.click(loadClick);
  rightClickify(el, loadClick);

  return { el: el, textEl: textEl };
}

function createShadowedSet(el) {
  var topEl = el;
  var bbox = el.getBBox(false);
  el = paper.rect(bbox.x, bbox.y, bbox.width, bbox.height);
  el.attr({ fill: '#000', 'fill-opacity': 0.5 });
  topEl.toFront();

  var set = paper.set();
  set.push(el, topEl);
  return set;
}

function memberMidpoint(member) {
  return [(member.node1.x + member.node2.x) / 2,
  (member.node1.y + member.node2.y) / 2];
}

function updateMemberLabel(member, label, color) {
  if (member.textEl)
    member.textEl.remove();
  var mid = memberMidpoint(member);
  var textEl = paper.text(mid[0], mid[1], label);
  textEl.attr({
    'fill': color,
    'font-size': SIZES.memberLabel
  });
  member.textEl = createShadowedSet(textEl);
}
function updateSupportLabel(support, label) {
  if (support.textEl)
    support.textEl.remove();
  var pt = support.vertical
    ? [support.node.x, support.node.y - SIZES.support / 2]
    : [support.node.x + SIZES.support / 2, support.node.y];
  var textEl = paper.text(pt[0], pt[1], label);
  textEl.attr({
    'fill': COLORS.supportForce,
    'font-size': SIZES.supportLabel
  });
  support.textEl = createShadowedSet(textEl);
}

function nodesToFront() {
  _.each(members, function (x) {
    x.el.toFront();
    if (x.textEl) x.textEl.toFront();
  });
  _.each(supports, function (x) {
    x.el.toFront();
  });
  _.each(loads, function (x) {
    x.el.toFront();
    if (x.textEl) x.textEl.toFront();
  });
  _.each(supports, function (x) {
    if (x.textEl) x.textEl.toFront();
  });
  _.each(nodes, function (node) {
    node.el.toFront();
  });
}

$(function () {
  paper = Raphael('canvas', w, h);
  paper.renderfix();
  drawGrid();
});

/*
  Interaction - various events on elements 
*/
var mode = 'select';

var NODE_SNAP = gridspace / 4;
var UNIT_ANGLE = 1 / 180 * Math.PI; // 1 degree snap

function rightClickify(raphaelEl, handler) {
  $(raphaelEl.node).bind('contextmenu', function (e) {
    handler.apply(raphaelEl, [e, e.x, e.y]);
    return false;
  });
}

function canvasCoords(pageX, pageY) {
  var off = $('#canvas').offset();
  return [pageX - off.left, pageY - off.top];
}
function fixEventCoords(event) {
  // Calculate pageX/Y if missing and clientX/Y available
  if (event.pageX == null && event.clientX != null) {
    var doc = document.documentElement, body = document.body;
    event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0)
      - (doc && doc.clientLeft || body && body.clientLeft || 0);
    event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0)
      - (doc && doc.clientTop || body && body.clientTop || 0);
  }

  var xy = canvasCoords(event.pageX, event.pageY);
  event.dclCanvasX = xy[0];
  event.dclCanvasY = xy[1];
}
function isLeftClick(event) {
  if (event.which == null) // IE case 
    return (event.button < 2);
  else // All others 
    return (event.which < 2);
}

// Event handlers

function bgClick(event) {
  fixEventCoords(event);
  var x = event.dclCanvasX;
  var y = event.dclCanvasY;

  if (!event.shiftKey) {
    x = Math.round(x / NODE_SNAP) * NODE_SNAP;
    y = Math.round(y / NODE_SNAP) * NODE_SNAP;
  }

  if (mode == 'add-node-btn') {
    createNode(x, y);
    reRunAlgo();
  }
}

function nodeClick(event) {
  var node = nodes[this.dclSerial];
  switch (mode) {
    case 'add-node-btn':
      /*if (event.which != 1) {*/
      if (!isLeftClick(event) || event.ctrlKey) {
        deleteNode(node);
      }
      reRunAlgo();
      break;

    case 'add-support-btn':
      node.supportType = (node.supportType - 1) % 4;

      _.each(node.supports, function (support) {
        deleteSupport(support);
      });

      if (node.supportType & 1) {
        createSupport(node, false);
      }
      if (node.supportType & 2) {
        createSupport(node, true);
      }
      reRunAlgo();
      break;
  }
}

function memberClick(event) {
  switch (mode) {
    case 'add-member-btn':
      if (event.which != 1) {
        deleteMember(members[this.dclSerial]);
        reRunAlgo();
      }
      break;
  }
}

function loadClick(event) {
  switch (mode) {
    case 'add-load-btn':
      if (event.which != 1) {
        deleteLoad(loads[this.dclSerial]);
        reRunAlgo();
      }
      break;
  }
}

var ghostMember = null;
var ghostLoad = null;

function nodeDragStart(x, y, event) {
  var node = nodes[this.dclSerial];
  switch (mode) {
    case 'add-node-btn':
      node.el.realEl.attr({ 'fill-opacity': 0.5 });

      this.dclLastDx = 0;
      this.dclLastDy = 0;
      this.dclOX = node.x;
      this.dclOY = node.y;

      break;

    case 'add-member-btn':
      var path = [['M', node.x, node.y], ['l', 0, 0]];
      ghostMember = paper.path(path);
      ghostMember.attr({
        stroke: COLORS.ghostMember,
        'stroke-width': SIZES.memberWidth
      });
      nodesToFront();

      break;

    case 'add-load-btn':
      _.each(node.loads, function (load) {
        deleteLoad(load);
      });

      var path = [['M', node.x, node.y], ['l', 0, 0]];
      ghostLoad = createLoadEls(node, 0, 0);
      ghostLoad.dclValue = 0;
      ghostLoad.dclAngle = 0;
      break;
  }
}

function nodeDragEnd(event) {
  fixEventCoords(event);
  var node = nodes[this.dclSerial];
  switch (mode) {
    case 'add-node-btn':
      node.el.realEl.attr({ 'fill-opacity': 1 });
      break;

    case 'add-member-btn':
      var hit = paper.getElementByPoint(event.clientX, event.clientY);
      if (hit && hit.dclType == 'node' &&
        nodes[hit.dclSerial] != node) {
        createMember(node, nodes[hit.dclSerial]);
      }

      ghostMember.remove();
      reRunAlgo();
      break;

    case 'add-load-btn':
      if (ghostLoad.dclValue > 0) {

        createLoad(node, ghostLoad.dclValue, ghostLoad.dclAngle);
      }
      ghostLoad.el.remove();
      ghostLoad.textEl.remove();
      reRunAlgo();
      break;
  }
}

function nodeDragMove(dx, dy, x, y, event) {
  var node = nodes[this.dclSerial];
  switch (mode) {
    case 'add-node-btn':
      var cx = this.dclOX + dx;
      var cy = this.dclOY + dy;
      if (!event.shiftKey) {
        cx = Math.round(cx / NODE_SNAP) * NODE_SNAP;
        cy = Math.round(cy / NODE_SNAP) * NODE_SNAP;
        dx = cx - this.dclOX;
        dy = cy - this.dclOY;
      }

      var changed = (node.x != cx || node.y != cy);

      if (changed) {
        node.el.translate(dx - this.dclLastDx, dy - this.dclLastDy);
        node.x = cx;
        node.y = cy;
      }

      _.each(node.members, function (member) {
        member.el.attr('path', memberPath(member.node1, member.node2));
      });

      var that = this;
      _.each(node.supports, function (support) {
        support.el.translate(dx - that.dclLastDx, dy - that.dclLastDy);
      });
      _.each(node.loads, function (load) {
        load.el.translate(dx - that.dclLastDx, dy - that.dclLastDy);
        load.textEl.translate(dx - that.dclLastDx, dy - that.dclLastDy);
      });

      this.dclLastDx = dx;
      this.dclLastDy = dy;

      if (changed)
        reRunAlgo(true);
      break;

    case 'add-member-btn':
      var path = ghostMember.attr('path');

      var hit = paper.getElementByPoint(event.clientX, event.clientY);
      if (hit && hit.dclType == 'node' &&
        nodes[hit.dclSerial] != node) {
        dx = nodes[hit.dclSerial].x - node.x;
        dy = nodes[hit.dclSerial].y - node.y;
      }

      path[1] = ['l', dx, dy];
      ghostMember.attr('path', path);
      break;

    case 'add-load-btn':
      var val = Math.round(Math.sqrt(dy * dy + dx * dx) / PIXELS_PER_UNIT_LOAD);
      var angle = Math.atan2(dy, dx);
      if (!event.shiftKey)
        angle = Math.round(angle / UNIT_ANGLE) * UNIT_ANGLE;

      ghostLoad.el.remove();
      ghostLoad.textEl.remove();
      ghostLoad = createLoadEls(node, val, angle);
      ghostLoad.dclValue = val;
      ghostLoad.dclAngle = angle;

      break;
  }
}


$(function () {
  $('#add-node-btn').button().click(function () {
    setSelection('add-node-btn');
  });
  $('#add-member-btn').button().click(function () {
    setSelection('add-member-btn');
  });
  $('#add-support-btn').button().click(function () {
    setSelection('add-support-btn');
  });
  $('#add-load-btn').button().click(function () {
    setSelection('add-load-btn');
  });

  function setSelection(name) {
    mode = name;
    $('button').removeClass('active');
    $('button#' + name).addClass('active');
  }

  setSelection('add-node-btn');
});

/* 
  Model - data structure for storing data
*/
var nodes = {};
var members = {};
var supports = {};
var loads = {};
var serial = 0;

function resetModel() {
  try {
    stopAlgo();

    _.each(nodes, function (node) {
      deleteNode(node); // will delete attached members, supports, loads
    });
    serial = 0;
  } finally {
    runAlgo();
  }
}

function createNode(x, y) {
  var s = ++serial;
  nodes[s] = {
    serial: s,
    el: createNodeEl(x, y, s),
    x: x,
    y: y,
    members: {},
    supports: {},
    loads: {},
    supportType: 0
  };

  nodesToFront();
  reRunAlgo();
}

function deleteNode(node) {
  node.el.remove();
  delete nodes[node.serial];

  // remove members
  _.each(node.members, function (member) {
    deleteMember(member);
  });
  // remove supports
  _.each(node.supports, function (support) {
    deleteSupport(support);
  });
  // remove loads
  _.each(node.loads, function (load) {
    deleteLoad(load);
  });

  reRunAlgo();
}

function findMember(node1, node2) {
  return _.find(node1.members, function (member) {
    return getOtherNode(member, node1) == node2;
  });
}

function createMember(node1, node2) {
  if (findMember(node1, node2))
    return;

  var s = ++serial;
  var member = members[s] = {
    serial: s,
    el: createMemberEl(node1, node2, s),
    node1: node1,
    node2: node2
  };
  node1.members[s] = member;
  node2.members[s] = member;

  nodesToFront();
  reRunAlgo();
}
function deleteMember(member) {
  delete member.node1.members[member.serial];
  delete member.node2.members[member.serial];
  member.el.remove();
  if (member.textEl)
    member.textEl.remove();
  delete members[member.serial];

  reRunAlgo();
}


function createSupport(node, vertical) {
  var s = ++serial;
  var support = supports[s] = {
    serial: s,
    el: createSupportEl(node, vertical, s),
    node: node,
    vertical: vertical
  };
  node.supports[s] = support;

  nodesToFront();
  reRunAlgo();
}
function deleteSupport(support) {
  delete support.node.supports[support.serial];
  support.el.remove();
  if (support.textEl)
    support.textEl.remove();
  delete supports[support.serial];

  reRunAlgo();
}

function createLoad(node, val, angle) {
  var s = ++serial;

  var compX = Math.cos(angle) * val;
  var compY = Math.sin(angle) * val;

  var els = createLoadEls(node, val, angle, s);
  var load = loads[s] = {
    serial: s,
    el: els.el,
    textEl: els.textEl,
    node: node,
    compX: compX,
    compY: compY,
    val: val,
    angle: angle
  };
  node.loads[s] = load;

  nodesToFront();
  reRunAlgo();
}
function deleteLoad(load) {
  delete load.node.loads[load.serial];
  load.el.remove();
  load.textEl.remove();
  delete loads[load.serial];

  reRunAlgo();
}


$(function () {
  $('#clear-btn').button().click(function () {
    if (_.size(nodes) == 0 || confirm("We're about to clear the screen and erase your current work.")) {
      resetModel();
    }
  });
  $('#blob').click(function () {
    this.select();
  });
});
