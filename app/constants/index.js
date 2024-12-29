export const HERO_CONTENT = `Hi I am a Software Engineer and I like to build cool stuff. This website is a little preview of what I have worked on in the past and my experiences working on these projects. Feel free to reach out to me if you have any questions or want to collaborate on a project. Make sure to test out the chatbot and look at the blogs I have been writing.`;

export const EXPERIENCES = [
  {
    year: "August 2024 - December 2024",
    role: "Teaching Assistant, STEM Guide",
    company: "Department of Computer Science, DePauw University",
    description: `Assisted in classroom activities and tutored 60 students on algorithms, lists, trees, and graphs for Algorithmic Foundations of Computation (CSC 296).`,
    description2: `Held office hours to assist students with weekly challenge problems and give feedback on solutions, increasing average homework scores by 10%.`,
    technologies: ["Graphs", "Trees", "Algorithms"],
  },
  {
    year: "July 2024 - September 2024",
    role: "Software Engineering Fellow",
    company: "Headstarter AI",
    description: `Participated in a competitive fellowship, developing and deploying 5 AI projects in 5 weeks using Python, Django, ReactJS, NextJS, Firebase, AWS, OpenAI, HTML, & CSS. Gained hands-on experience with machine learning models and tools, including RAG, vectors, authentication, DNS, and StripeAPI.`,
    technologies: ["Python", "RAG Models", "React.js", "AWS", "OpenAI", "Authentication", "Stripe API"],
  },
  {
    year: "December 2022 - May 2023",
    role: "Software Developer",
    company: "AV Actions",
    description: `Designed and developed user interfaces for web applications using React.js. Built an online dashboard using Django to view roles and permissions, stock movements, and inventory values. Used AWS Cognito for authentication and authorization.`,
    technologies: ["React.js", "Django", "AWS Cognito Authentication", "PostgreSQL"],
  },
];

export const PROJECTS = [
  {
    title: "Twitter Sentiment Analysis Language processing model",
    image: "/assets/projects/project-1.png",
    description:
      "A Python script that tokenizes tweets to analyze the sentiment of the tweets. Used this to understand company and stock sentiment on Twitter by analyzing what users are saying on Twitter.",
    technologies: ["Python", "Tensorflow", "Playwright", "Twitter Developer API", "MongoDB"],
  },
  {
    title: "Retrieval Argument Generation Model",
    image: "/assets/projects/project-2.png",
    description:
      "A chatbot model that uses RAG to answer questions. Used in a personal portfolio website to answer 'About me' questions.",
    technologies: ["HTML", "CSS", "Angular", "Firebase"],
  },
  {
    title: "ASL to English Augmented Reality Translator",
    image: "/assets/projects/project-3.jpg",
    description: "An augmented reality translator that converts American Sign Language to English text in real-time.",
    technologies: ["HTML", "CSS", "React", "Bootstrap"],
  },
  {
    title: "Real-Time Analytics Dashboard",
    image: "/assets/projects/project-4.jpg",
    description: "A real-time analytics dashboard built with Vue.js, Express, and MySQL.",
    technologies: ["HTML", "CSS", "Vue.js", "Express", "MySQL"],
  },
];

export const CONTACT = {
  email: "me@samipdevkota.com",
};


export const BLOGS = [
  {
    title: "Understanding Retrieval-Augmented Generation (RAG)",
    date: "Dec 25, 2024",
    description: "Explore how RAG enhances AI models by improving information retrieval and response generation.",
    link: "/blogs/rag-explained",
  },
  {
    title: "Building Scalable Backend Systems",
    date: "Dec 15, 2024",
    description: "Learn the fundamentals of designing backend systems that scale effectively.",
    link: "/blogs/scalable-backend",
  },
  {
    title: "A Guide to Modern Frontend Frameworks",
    date: "Dec 10, 2024",
    description: "An overview of the most popular frontend frameworks and their use cases.",
    link: "/blogs/frontend-frameworks",
  },
];
