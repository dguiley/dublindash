import { extend } from '@tresjs/core'
import {
  // Geometries
  BoxGeometry,
  PlaneGeometry,
  CylinderGeometry,
  RingGeometry,
  CircleGeometry,
  
  // Materials
  MeshBasicMaterial,
  MeshLambertMaterial,
  
  // Lights
  AmbientLight,
  DirectionalLight,
  
  // Camera
  PerspectiveCamera,
  
  // Core objects
  Group,
  Mesh
} from 'three'

// Extend TresJS with all the Three.js objects we need
extend({
  // Geometries
  BoxGeometry,
  PlaneGeometry,
  CylinderGeometry,
  RingGeometry,
  CircleGeometry,
  
  // Materials
  MeshBasicMaterial,
  MeshLambertMaterial,
  
  // Lights
  AmbientLight,
  DirectionalLight,
  
  // Camera
  PerspectiveCamera,
  
  // Core objects
  Group,
  Mesh
})