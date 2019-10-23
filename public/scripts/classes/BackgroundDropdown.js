namespace.html.BackgroundDropdown = (() =>
{
	var BackgroundDropdown = function(images, onSelect)
	{
		// -----------------------------
		// calculate position of the dropdown
		// -----------------------------
		
		let dropdown = new namespace.html.Dropdown();
		dropdown.setAttribute('id', 'background-dropdown');
		
		let wrapper = new namespace.html.Wrapper();
		dropdown.appendChild(wrapper);

		let label = new namespace.html.Label();
		label.innerHTML = 'CHOOSE BACKGROUND:';
		wrapper.appendChild(label);
		wrapper.appendChild('<divider-x-small></divider-x-small>');

		let RADIO_BUTTON_GROUP_NAME = 'scene-background';

		for (let i=0; i<images.length; i++)
		{
			let image = images[i];

			let radioButton = new namespace.html.RadioButton();
			radioButton.name = RADIO_BUTTON_GROUP_NAME;
			radioButton.setAttribute('dir', image);
			radioButton.onclick = onSelect;
			wrapper.appendChild(radioButton);

			let imageElement = new namespace.html.Image(image + 'negX.png');
			imageElement.width = 100;
			imageElement.height = 100;
			imageElement.onclick = radioButton.click.bind(radioButton);
			wrapper.appendChild(imageElement);

			if (i < images.length - 1)
			{
				wrapper.appendChild('<divider-x-small></divider-x-small>');
			}			
		}

		dropdown.querySelector('input[dir="' + options.SKY_CUBE_FILEPATH + '"]').checked = true;				

		return dropdown;
	};

	return BackgroundDropdown;
})();