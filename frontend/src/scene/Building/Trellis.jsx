const Trellis = () => {
    const trellisColor = "#CCCCFF" // matching periwinkle
    const rungSpacing = 2 // space between each rung
    const numRungs = 20 // number of rungs
    
    return (
      <group position={[-12, 14, 0]}> {/* Positioned at top of walls */}
        {/* Long side beams */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[0.3, 2, 50]} /> {/* Length covers front to back wall */}
          <meshStandardMaterial color={trellisColor} />
        </mesh>
        
        <mesh position={[3, 1, 0]}>
          <boxGeometry args={[0.3, 2, 50]} />
          <meshStandardMaterial color={trellisColor} />
        </mesh>
  
        {/* Rungs */}
        {Array.from({ length: numRungs }, (_, i) => (
          <mesh 
            key={i} 
            position={[1.5, 1, -23 + (i * rungSpacing)]}
          >
            <boxGeometry args={[3.3, 0.3, 0.3]} />
            <meshStandardMaterial color={trellisColor} />
          </mesh>
        ))}
      </group>
    )
  }
  
  export default Trellis;