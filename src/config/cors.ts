export const corsOptions = {
  origin: [
    "https://kalustebottifrontend-arvolaskuri-demo.2.rahtiapp.fi",
    "https://arvolaskuri-alyakokeilut.2.rahtiapp.fi",
    "http://localhost:5173",
    "https://localhost:5173",
    "http://localhost:3000",
    "https://localhost:4173",
    "https://kaluste-frontend-25k-git-kalustearvio-25k.2.rahtiapp.fi",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
