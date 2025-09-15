// Animate Stats (only when visible)
const counters = document.querySelectorAll(".counter");

const animateCounter = (counter) => {
  counter.innerText = "0";
  const target = +counter.getAttribute("data-target");
  const increment = target / 100;

  const updateCounter = () => {
    const current = +counter.innerText;
    if (current < target) {
      counter.innerText = `${Math.ceil(current + increment)}`;
      setTimeout(updateCounter, 20);
    } else {
      counter.innerText = target.toLocaleString();
    }
  };
  updateCounter();
};

const observer = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

counters.forEach((counter) => {
  observer.observe(counter);
});

// Mobile menu toggle
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("show");
  hamburger.classList.toggle("active");
});
