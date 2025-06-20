# Game Theory Studio

![Game Theory Studio](https://img.shields.io/badge/Game%20Theory-Studio-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)

An interactive web application for **Monte Carlo simulations** in game theory with real-time visualizations and strategic analysis. Explore strategic decision-making through hands-on experimentation and professional-grade analysis tools.

## 🎯 Features

### 🎮 **Game Type Selection Interface**
- **Pre-built Scenarios**: Choose from classic games like Prisoner's Dilemma, Battle of the Sexes, Chicken Game, and more
- **Educational Focus**: Each game includes learning objectives, real-world applications, and difficulty levels
- **Smart Filtering**: Filter by category, difficulty, and search by keywords
- **Customizable**: Create your own game scenarios with custom payoff matrices

### 🎛️ **Dynamic Payoff Matrix Editor**
- **Real-time Analysis**: Live Nash equilibrium detection and dominant strategy identification
- **Interactive Templates**: Quick setup with 5 preset classic games
- **Visual Feedback**: Color-coded cells, strategic indicators, and performance warnings
- **Advanced Validation**: Comprehensive error checking and strategic suggestions

### 👥 **Player Configuration System**  
- **Flexible Setup**: Configure 2-5 players with customizable strategies
- **Behavior Presets**: Choose from Rational, Random, Aggressive, Conservative, and Adaptive player types
- **Mixed Strategies**: Define custom probability distributions for each strategy
- **Advanced Settings**: Fine-tune risk tolerance, learning rates, and adaptation parameters

### ✅ **Game Validation & Preview System**
- **Real-time Validation**: Instant feedback on game configuration completeness
- **Strategic Analysis Preview**: See Nash equilibria, Pareto optimal outcomes, and game properties
- **Game Balance Assessment**: Analyze fairness, symmetry, and strategic depth
- **Readiness Indicators**: Clear visual feedback when ready to run simulations

### 🎲 **Monte Carlo Simulation Engine**
- **High-Performance Computing**: Run thousands of iterations with real-time progress tracking
- **Probabilistic Analysis**: Calculate outcome probabilities and expected payoffs
- **Strategy Evolution**: Track how strategies perform over multiple iterations
- **Statistical Accuracy**: Professional-grade Monte Carlo methods with confidence intervals

### 📊 **Advanced Visualizations**
- **Real-time Charts**: Dynamic graphs showing strategy evolution and outcome distributions
- **Interactive Results**: Explore simulation data with interactive charts and tables
- **Export Capabilities**: Download results in CSV, JSON, and markdown report formats
- **Strategic Insights**: Visual indicators for Nash equilibria and dominant strategies

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **pnpm** package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PatrickRino/game-theory-studio.git
   cd game-theory-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Technology Stack

### **Frontend Framework**
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development

### **UI & Styling**
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible component library
- **Radix UI** - Headless component primitives
- **Lucide React** - Beautiful icon library

### **Data Visualization**
- **D3.js 7.9.0** - Powerful data visualization library
- **Recharts** - Composable charting library
- **Math.js** - Mathematical computation library

### **Game Theory & Analysis**
- **Custom Monte Carlo Engine** - High-performance simulation engine
- **Game Theory Utilities** - Nash equilibrium calculation, strategic analysis
- **ML Matrix** - Linear algebra operations for game analysis

## 🎯 Usage Guide

### 1. **Select a Game Scenario**
Choose from pre-built scenarios or create your own:
- Browse by category (Classic, Economic, Evolutionary, etc.)
- Filter by difficulty level (Beginner, Intermediate, Advanced)
- Read learning objectives and real-world applications

### 2. **Configure the Payoff Matrix**
Set up the game's reward structure:
- Use preset templates for quick setup
- Customize payoffs for each player and strategy combination
- Real-time validation ensures mathematical consistency

### 3. **Set Up Players**
Configure player count and behavior:
- Choose player count (2-5 players)
- Select behavior presets or customize strategies
- Define mixed strategy probabilities

### 4. **Validate & Preview**
Review your game configuration:
- Check for Nash equilibria and dominant strategies
- Analyze game properties (zero-sum, symmetry, etc.)
- Ensure all requirements are met

### 5. **Run Simulations**
Execute Monte Carlo simulations:
- Set iteration count (1,000 - 100,000+)
- Monitor real-time progress
- View live results as they compute

### 6. **Analyze Results**
Explore the simulation outcomes:
- Interactive charts and visualizations
- Statistical analysis and confidence intervals
- Export data for further research

## 📚 Game Theory Concepts

Game Theory Studio helps you understand key concepts:

- **Nash Equilibrium** - Stable strategy combinations
- **Dominant Strategies** - Strategies that are always optimal
- **Pareto Efficiency** - Outcomes that can't be improved without hurting someone
- **Mixed Strategies** - Probabilistic strategy choices
- **Zero-Sum Games** - Competitive scenarios where gains equal losses
- **Evolutionary Stability** - Strategies that persist over time

## 🎓 Educational Applications

Perfect for:
- **University Courses** - Economics, Mathematics, Computer Science
- **Research Projects** - Game theory and behavioral economics research
- **Self-Learning** - Interactive exploration of strategic thinking
- **Professional Development** - Business strategy and decision-making

## 📊 Example Scenarios

### **Prisoner's Dilemma**
Classic scenario exploring cooperation vs. defection:
- **Players**: 2 prisoners
- **Strategies**: Cooperate or Defect
- **Key Insight**: Individual rationality can lead to suboptimal outcomes

### **Battle of the Sexes**
Coordination game with conflicting preferences:
- **Players**: 2 partners choosing activities
- **Strategies**: Opera or Football
- **Key Insight**: Multiple equilibria and coordination challenges

### **Public Goods Game**
Multi-player scenario exploring collective action:
- **Players**: 3-5 community members
- **Strategies**: Contribute or Free-ride
- **Key Insight**: Tension between individual and collective interests

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect Next.js and configure settings
3. Deploy with zero configuration needed

### **Other Platforms**
- **Netlify**: Supports Next.js with SSG
- **AWS Amplify**: Full-stack deployment
- **Railway**: Easy deployment with database support

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Write meaningful commit messages
- Add documentation for new features
- Ensure all tests pass

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Patrick Rino**
- GitHub: [@PatrickRino](https://github.com/PatrickRino)

## 🙏 Acknowledgments

- Game theory concepts from classic literature
- Open source community for excellent libraries
- Educational institutions for inspiration and feedback

## 📈 Roadmap

### **Coming Soon**
- **Evolutionary Game Theory** - Dynamic strategy evolution over time
- **Coalition Formation** - Multi-player alliance mechanics
- **Tournament Mode** - Strategy competitions and rankings
- **Advanced AI Opponents** - Machine learning-based players
- **Collaborative Features** - Multi-user game setup and analysis

### **Future Enhancements**
- **3D Visualizations** - Immersive strategy space exploration
- **Mobile App** - Native iOS and Android applications
- **API Integration** - External data sources and research databases
- **Educational Curriculum** - Structured learning paths and assessments

---

**Game Theory Studio** - Making strategic thinking accessible through interactive technology.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PatrickRino/game-theory-studio)
