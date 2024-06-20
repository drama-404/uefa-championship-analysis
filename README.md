# UEFA European Championship Analysis Project

## Project Overview

This project aims to provide a comprehensive analysis of the UEFA European Championship (EURO) and Nations League matches from 1960 to 2024. Using a dataset sourced from Kaggle, the project explores various aspects of the championships, including historical performance, player and coach impact, match conditions, attendance trends, and more. Our goal is to uncover unique and valuable insights that will captivate football enthusiasts and analysts alike.

## Dataset

The dataset includes:

- **EURO Matches (1960-2024)**: Detailed match data for each tournament.
- **Nations League Matches (2019-2023)**: All matches from the Nations League.
- **Friendly Matches (2021-2024)**: Data on friendly matches played between teams.
- **Qualifying Matches (1960-2024)**: Matches played during the qualification stages for the EURO.
- **Coaches Data**: Information on all coaches from 1960 to 2024.
- **Players Lineups**: Data on all players participating in the tournaments.
- **EURO Summary**: Basic information about each EURO, including winners, goals, and attendance.

## Project Structure

The project is organized as follows:

- `inputs/`: Contains all the raw data files.
  - `matches/`: Subfolder containing match data files.
    - `euro/`: EURO match data by year.
    - `nations/`: Nations League match data.
    - `friendly_2021-2024.csv`: Friendly match data.
    - `qualifying_1960-2024.csv`: Qualifying match data.
  - `logos/`: Flags of associations.
  - `euro_coaches.csv`: Coaches data.
  - `euro_lineups.csv`: Players lineups.
  - `euro_summary.csv`: Summary of each EURO.

- `notebooks/`: Jupyter notebooks for data analysis and visualization.
- `scripts/`: Python scripts for data processing and analysis.
- `outputs/`: Generated outputs such as visualizations and reports.
- `README.md`: Project overview and instructions.

## Analysis Questions

Our analysis will focus on the following key questions:

1. How have different countries performed over the years? Which countries have shown significant improvement or decline?
2. What factors (e.g., home advantage, weather conditions, team rankings) most strongly predict match outcomes?
3. How have goal-scoring trends changed over the decades? Are matches becoming more high-scoring or defensive?
4. What is the impact of different coaches on team performance? Are there specific coaches who consistently outperform others?
5. Which players have had the most significant impact on their teams' successes? Consider metrics like goals scored, assists, and defensive contributions.
6. How has match attendance evolved over the years? What factors influence higher or lower attendance?
7. What is the success rate of penalty shootouts in the knockout stages? Are certain teams or players more successful in these high-pressure situations?
8. How do red cards affect the outcomes of matches? Is there a significant difference in win/loss rates for teams receiving red cards?
9. Do weather conditions (e.g., temperature, wind speed) have any correlation with match outcomes?
10. How do team performances in the EURO compare with their performances in the Nations League? Are there any notable differences or patterns?

## Getting Started

### Prerequisites

- Python 3.8+
- Jupyter Notebook
- Required libraries: pandas, numpy, matplotlib, seaborn, scikit-learn

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/drama-404/euro-analysis-project.git
   cd euro-analysis-project
   ```

2. Create a virtual environment and activate it:
   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```sh
   pip install -r requirements.txt
   ```

### Usage

1. Navigate to the `notebooks/` directory and open the Jupyter notebook:
   ```sh
   jupyter notebook
   ```

2. Run the notebooks to perform data analysis and generate visualizations.

## Contributions

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Dataset sourced from [Kaggle](https://www.kaggle.com/datasets/piterfm/football-soccer-uefa-euro-1960-2024/data)
- All contributors and the football analytics community

---

This README provides an initial overview of the project. We will update it with more detailed information as the project progresses.