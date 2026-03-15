import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BarChartComponent = ({ data }) => {
  if (!data || data.length === 0) return <div className="h-72 flex items-center justify-center text-gray-400">No data available</div>;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Verified" fill="#82ca9d" />
          <Bar dataKey="Pending" fill="#8884d8" />
          <Bar dataKey="Rejected" fill="#ff8042" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;