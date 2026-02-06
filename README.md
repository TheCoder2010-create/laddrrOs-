# NextN

## AI-Powered HR, Performance Management, and Coaching Platform

NextN is a cutting-edge web application leveraging Artificial Intelligence to transform Human Resources, performance management, and coaching processes. Built with a modern tech stack, NextN provides a comprehensive suite of tools designed to enhance employee development, streamline feedback, and offer data-driven insights.

## Features

*   **AI-Driven Analytics:** Gain deep insights from interviews, one-on-one meetings, and other conversations to improve decision-making and understanding.
*   **Automated Content Generation:** Generate professional briefing packets, personalized development suggestions, leadership pulse reports, and effective survey questions automatically.
*   **Personalized Coaching & Feedback:** Receive daily coaching tips, AI-driven goal feedback, and engage in performance chats. Submit and summarize anonymous feedback efficiently.
*   **Text Rewriting Tool:** Utilize AI to refine and improve written content.
*   **Interactive Dashboards:** Visualize key HR and performance metrics through intuitive and interactive dashboards.
*   **PDF Report Generation:** Generate and export detailed reports and documents in PDF format.

## Technologies Used

*   **Framework:** Next.js 15 (React)
*   **Language:** TypeScript
*   **AI Integration:** Genkit with Google Generative AI
*   **Styling:** Tailwind CSS
*   **UI Components:** Radix UI
*   **PDF Generation:** `jspdf` and `jspdf-autotable`
*   **Other:** `react-hook-form`, `zod`, `date-fns`, `recharts`, `lucide-react`

## Setup and Installation

To get NextN running locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/nextn.git
    cd nextn
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root of the project and add your Google Generative AI API key and any other necessary environment variables.
    ```
    GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here
    # Add other environment variables as needed
    ```

4.  **Run the Next.js Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js application, typically accessible at `http://localhost:3000`.

5.  **Run the Genkit Development Server:**
    In a separate terminal, start the Genkit development server to enable the AI flows:
    ```bash
    npm run genkit:dev
    ```
    This server typically runs on `http://localhost:4000` (or similar) and provides an interface to observe and test your AI flows.

## Usage

Once both development servers are running, open your web browser and navigate to `http://localhost:3000`. You can then:

*   Explore the various dashboards to view performance metrics and insights.
*   Interact with AI-powered features such as performance chat, feedback forms, and content generation tools.
*   Utilize the coaching tips and development suggestions for personal growth.

## AI Flows Development

The AI functionalities of NextN are powered by Genkit flows, located in the `src/ai/flows` directory.
*   To watch for changes in AI flows and automatically restart the Genkit server, use `npm run genkit:watch`.
*   Refer to the [Genkit documentation](https://genkit.dev/docs) for detailed information on how to create, test, and extend AI flows.

## Project Structure

A high-level overview of the project directory structure:

```
.
├── src/
│   ├── ai/               # Genkit AI flows and schemas
│   ├── app/              # Next.js pages and routes
│   ├── components/       # Reusable UI components (including dashboards and UI primitives)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and helper libraries
│   └── services/         # API service integrations and data fetching logic
├── public/               # Static assets
├── next.config.ts        # Next.js configuration
├── package.json          # Project dependencies and scripts
└── tailwind.config.ts    # Tailwind CSS configuration
```

## Contributing

Contributions are welcome! Please refer to our `CONTRIBUTING.md` (if available) for guidelines on how to contribute to NextN.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.