        <AnimatedCard delay={0.55}>
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, delay, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
  // Simple loading state for initial render
        transition={{ delay: 0.6, duration: 0.2 }}
  if (isLoading) {
      <div className="space-y-6 sm:space-y-8 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-dark p-6 h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card-dark p-6 h-80"></div>
          ))}
        </div>
  }
}