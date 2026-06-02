import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    about:
    {
        title: "Hello, I'm Moiz!",
        subtitle: "A Software Engineer",
        description: [
            "Over the past five years, I've been working as a software engineer building and improving digital products across POS systems, booking platforms, e-commerce, and internal business tools. My work has focused on turning complex requirements into reliable, scalable systems while keeping the user experience simple and intuitive. I've been involved in everything from architecture decisions to feature delivery, always aiming to balance performance, usability, and maintainability.",
            "A significant part of my experience comes from working on a large-scale POS platform where I contributed to both product and engineering layers. I helped improve the user experience, which reduced support load significantly, and built core features like loyalty systems, gift cards, and wallet integrations with Apple Wallet and Google Wallet. I also worked on promotional systems with geo-targeting, branch tracking, and notification flows, while improving backend performance by optimizing APIs and reducing latency.",
            "Alongside this, I've built and supported multiple real-world platforms including flight and travel booking systems and learning management tools. These projects involved working with real-time data, integrating external APIs, and ensuring smooth, responsive interfaces across devices. Across all my work, I focus on writing clean, scalable code and building systems that are easy to maintain, extend, and trust in production.",
        ]
    },
};

const aboutSlice = createSlice({
    name: "about",
    initialState,
    reducers: {},
});

export default aboutSlice.reducer;
