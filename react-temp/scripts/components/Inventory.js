import React from 'react';
import AddFishForm from './AddFishForm';
import autobind from 'autobind-decorator';
import Firebase from 'firebase';
const ref = new Firebase('https://attrox-fish-store.firebaseio.com/');

@autobind
class Inventory extends React.Component {
	constructor() {
		super();
		this.state = {
			uid: ''
		}
	}

	authenticate(provider) {
		ref.authWithOAuthPopup(provider, this.authHandler);
	}

	componentWillMount() {
		var token = localStorage.getItem('token');
		if (token) {
			ref.authWithCustomToken(token, this.authHandler);
		}
	}

	authHandler(err, authData) {
		if (err) {
			console.err(err);
			return;
		}

		// Save the login token in the browser
		localStorage.setItem('token', authData.token);

		const storeRef = ref.child(this.props.params.storeId);
		storeRef.on('value', (snapshot)=> {
			var data = snapshot.val() || {};

			// Claim it as our own if there is no owner already
			if (!data.owner) {
				storeRef.set({
					owner: authData.uid
				});
			}

			// Update our state to reflect the current store owner and user
			this.setState({
				uid: authData.uid,
				owner: data.owner || authData.uid
			});
		});
	}

	renderLogin() {
		return (
			<nav className="login">
				<h2>Inventory</h2>
				<p>Sign in to manage your store's inventory</p>
				<button className="github" onClick={this.authenticate.bind(this, 'github')}>Log In with Github</button>
			</nav>
		);
	}

	renderInventory(key) {
		var linkState = this.props.linkState;
		return (
			<div className="fish-edit" key={key}>
				<input type="text" valueLink={linkState('fishes.' + key + '.name')}/>
				<input type="text" valueLink={linkState('fishes.' + key + '.price')}/>
				<select valueLink={linkState('fishes.' + key + '.status')}>
					<option value="unavailable">Sold Out!</option>
					<option value="available">Fresh!</option>
				</select>
				<textarea valueLink={linkState('fishes.' + key + '.desc')}></textarea>
				<input type="text" valueLink={linkState('fishes.' + key + '.image')}/>
				<button onClick={this.props.removeFish.bind(null, key)}>Remove Fish</button>
			</div>
		)
	}

	logout() {
		ref.unauth();
		localStorage.removeItem('token');
		this.setState({
			uid: null
		})
	}

	render() {
		let logoutButton = <button onClick={this.logout}>Log Out!</button>

		if (!this.state.uid) {
			return (
				<div>{this.renderLogin()}</div>
			);
		}
		if (this.state.uid !== this.state.owner) {
			return (
				<div>
					<p>Sorry, you aren't the owner of this store</p>
				</div>
			);
		}
		return (
			<div>
				<h2>Inventory</h2>
				{logoutButton}
				{Object.keys(this.props.fishes).map(this.renderInventory)}
				<AddFishForm {...this.props} />
				<button onClick={this.props.loadSamples}>Load Sample Fishes</button>
			</div>
		);
	}
}

Inventory.propTypes = {
	removeFish: React.PropTypes.func.isRequired,
	fishes: React.PropTypes.object.isRequired,
	loadSamples: React.PropTypes.func.isRequired,
	addFish: React.PropTypes.func.isRequired,
	linkState: React.PropTypes.func.isRequired
}

export default Inventory;