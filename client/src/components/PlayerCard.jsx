const PlayerCard = ({ title, playerId }) => {
  return (
    <div className="bg-gray-800 p-6 rounded w-64 text-center shadow">
      <h2 className="text-xl mb-2">{title}</h2>
      <p className="text-green-400 font-bold text-lg">
        {playerId}
      </p>
    </div>
  );
};

export default PlayerCard;