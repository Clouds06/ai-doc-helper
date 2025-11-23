export const MiniConfetti = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="absolute w-1.5 h-1.5 rounded-sm"
        style={{
          backgroundColor: ['#FFD700', '#FF6347', '#4169E1', '#32CD32'][i % 4],
          left: `${10 + Math.random() * 80}%`, top: `-10%`,
          animation: `confetti-drop ${0.5 + Math.random()}s ease-out forwards`,
          animationDelay: `${Math.random() * 0.2}s`,
          transform: `rotate(${Math.random() * 360}deg)`
        }}
      />
    ))}
    <style>{`@keyframes confetti-drop { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(120px) rotate(720deg); opacity: 0; } }`}</style>
  </div>
);
