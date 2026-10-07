// Filename - App.tsx

import "./App.css";
import { Link, Route, Router, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Compare from "./Pages/CompareTeams";
import Rankings from "./Pages/Rankings";
import RawData from "./Pages/RawData";
import Search from "./Pages/Search";
import Settings from "./widgets/Settings";

const queryClient = new QueryClient();

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<Router>
				<div className="App">
					<div className="App-header">
						<Link className="navbar-but" to="/Rankings">
							<div className="nav-text">Rankings</div>
						</Link>
						<Link className="navbar-but" to="/Search">
							<div className="nav-text">Search</div>
						</Link>
						<Link className="navbar-but" to="/Compare">
							<div className="nav-text">Compare Teams</div>
						</Link>
						<Link className="navbar-but" to="/RawData">
							<div className="nav-text">Raw Data</div>
						</Link>
					</div>
					<Settings />
					<Switch>
						<Route path="/" component={Rankings} />
						<Route path="/Rankings" component={Rankings} />
						<Route path="/RawData" component={RawData} />
						<Route path="/Search" component={Search} />
						<Route path="/Compare" component={Compare} />
					</Switch>
				</div>
			</Router>
		</QueryClientProvider>
	);
}
