
function State(initialValue, onChange) {

    let value = initialValue;
    const connections = new Set();
    
    const state = () => value;

    state.set = (val) => {
	value = val;
	if (onChange !== undefined) onChange(value);
	connections.forEach(con => con(value));
	return value;
    };

    state.onChange = (fn) => {
	fn(value);
	connections.add(fn);
	return () => connections.delete(fn);
    };

    if (onChange !== undefined) onChange(value);
    return state;
}

function Derived(dependencies, fn, onChange) {

    // initial
    const state = State(fn(...dependencies.map(x => x())));
    const derived = () => state();

    // intertwine the change states
    derived.onChange = state.onChange;

    // connect when anything changes
    const connections =
	  dependencies.map(
	      el => el.onChange(
		  _ => state.set(fn(...dependencies.map(
		      x => x())))));

    // finally get change
    const changeFnConnection = state.onChange(onChange);

    // disconnect all connections
    derived.destroy = () => {
	dependencies.forEach((_, key) => connections[key]());
	changeFnConnection();
    };
    
    // return the new derived state
    return derived;
}

/*
  TESTING
  */

const Modifier = (v) => Math.floor((v - 10) / 2);
const CalcAC = (armorPower, dex, armorUsesDex) =>
      armorPower + (armorUsesDex ? Modifier(dex) : 0);

const Dexterity = State(12, v => console.log(`DEX is now ${v}.`));
const ArmorPower = State(10, v => console.log(`ArmorPower is now ${v}.`));
const ArmorPowerUsesDex = State(true, v => console.log(`APUD: ${v}`));

const ArmorClass = Derived([ArmorPower, Dexterity, ArmorPowerUsesDex],
			   CalcAC,
			   (v) => console.log(`AC changed. ${v}`));
