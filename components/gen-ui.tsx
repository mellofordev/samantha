
import React from 'react'
import { Mafs, Coordinates, Plot, Theme, Text, Line } from 'mafs'

export default function GenUI() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">5G Network Visualization</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Frequency Spectrum Diagram</h2>
        <p className="text-gray-600 mb-4">
          5G utilizes a wide range of frequency bands, including sub-6 GHz and millimeter wave (mmWave).
        </p>

        <Mafs viewBox={{ x: [0, 40], y: [0, 2] }}>
          <Coordinates.Cartesian xAxis={false} yAxis={false} grid={false} />

          <Line.Segment point1={[0, 0.5]} point2={[10, 0.5]} color={Theme.blue} weight={3} />
          <Text x={5} y={0.7} attach="bottom" color={Theme.blue}>Sub-6 GHz</Text>
          <Text x={5} y={0.3} attach="top" color={Theme.gray}>Lower Frequencies (e.g., 3.5 GHz)</Text>

          <Line.Segment point1={[12, 1.5]} point2={[25, 1.5]} color={Theme.red} weight={3} />
          <Text x={18.5} y={1.7} attach="bottom" color={Theme.red}>mmWave</Text>
          <Text x={18.5} y={1.3} attach="top" color={Theme.gray}>Higher Frequencies (e.g., 28 GHz, 39 GHz)</Text>

          <Line.Segment point1={[27, 0.5]} point2={[40, 0.5]} color={Theme.green} weight={3} />
          <Text x={33.5} y={0.7} attach="bottom" color={Theme.green}>Extended mmWave</Text>
          <Text x={33.5} y={0.3} attach="top" color={Theme.gray}>Future Bands (e.g., > 50 GHz)</Text>
        </Mafs>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Network Architecture Diagram</h2>
        <p className="text-gray-600 mb-4">
          5G network architecture includes various components such as user equipment (UE), radio access network (RAN), and core network.
        </p>

        <Mafs viewBox={{ x: [0, 10], y: [0, 8] }}>
          <Coordinates.Cartesian xAxis={false} yAxis={false} grid={false} />

          <Text x={1} y={7} attach="bottom">User Equipment (UE)</Text>
          <Plot.OfX y={() => 6.5} minX={0.5} maxX={1.5} color={Theme.gray} weight={5} />

          <Text x={3} y={7} attach="bottom">Radio Access Network (RAN)</Text>
          <Plot.OfX y={() => 6.5} minX={2.5} maxX={3.5} color={Theme.blue} weight={5} />

          <Text x={5} y={7} attach="bottom">Edge Computing</Text>
          <Plot.OfX y={() => 6.5} minX={4.5} maxX={5.5} color={Theme.green} weight={5} />

          <Text x={7} y={7} attach="bottom">Core Network</Text>
          <Plot.OfX y={() => 6.5} minX={6.5} maxX={7.5} color={Theme.red} weight={5} />

          <Text x={9} y={7} attach="bottom">Data Network</Text>
          <Plot.OfX y={() => 6.5} minX={8.5} maxX={9.5} color={Theme.purple} weight={5} />

          <Line.Segment point1={[1, 6.5]} point2={[3, 6.5]} color={Theme.gray} weight={2} />
          <Line.Segment point1={[3, 6.5]} point2={[5, 6.5]} color={Theme.blue} weight={2} />
          <Line.Segment point1={[5, 6.5]} point2={[7, 6.5]} color={Theme.green} weight={2} />
          <Line.Segment point1={[7, 6.5]} point2={[9, 6.5]} color={Theme.red} weight={2} />

          <Text x={2} y={6} attach="top" color={Theme.gray}>Wireless Connection</Text>
          <Text x={4} y={6} attach="top" color={Theme.blue}>Data Processing</Text>
          <Text x={6} y={6} attach="top" color={Theme.green}>Low Latency</Text>
          <Text x={8} y={6} attach="top" color={Theme.red}>Network Management</Text>
        </Mafs>
      </section>
    </div>
  )
}
