self.onmessage = function(e) {
  const { allProjects, selectedCategory, query } = e.data;

  const filtered = allProjects.filter(
    project =>
      (selectedCategory === "all" ||
        project.category === selectedCategory) &&
      project.title
        .toLowerCase()
        .includes(query)
  );

  self.postMessage(filtered);
};
