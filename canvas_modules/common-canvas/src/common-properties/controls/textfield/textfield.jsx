/*
 * Copyright 2017-2025 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { TextInput } from "@carbon/react";
import ReadonlyControl from "./../readonly";
import ValidationMessage from "./../../components/validation-message";
import * as ControlUtils from "./../../util/control-utils";
import { formatMessage } from "./../../util/property-utils";
import { STATES } from "./../../constants/constants.js";
import { CONDITION_MESSAGE_TYPE, MESSAGE_KEYS, TRUNCATE_LIMIT } from "./../../constants/constants.js";
import TruncatedContentTooltip from "./../../components/truncated-content-tooltip";
import classNames from "classnames";
import { v4 as uuid4 } from "uuid";


const arrayValueDelimiter = ", ";

class TextfieldControl extends React.Component {
	constructor(props) {
		super(props);
		this.reactIntl = props.controller.getReactIntl();
		this.charLimit = ControlUtils.getCharLimit(props.control, props.controller.getMaxLengthForSingleLineControls());
		this.uuid = uuid4();
		this.id = ControlUtils.getControlId(props.propertyId, this.uuid);
		this.isList = false;
		if (this.props.control.valueDef) {
			if (this.props.control.valueDef.isList) {
				this.isList = true;
			}
			this.defaultValue = this.props.control.valueDef.defaultValue;
		}

		this.textInputRef = React.createRef();
	}

	handleChange(evt) {
		let value = evt.target.value;
		if (this.charLimit !== -1 && value) {
			value = value.substring(0, this.charLimit);
		}
		if (this.isList) {
			value = ControlUtils.splitNewlines(value, arrayValueDelimiter);
		}
		if (value.length === 0 && (typeof this.defaultValue === "undefined" || this.defaultValue === null)) {
			value = null;
		}
		this.props.controller.updatePropertyValue(this.props.propertyId, value);
	}

	render() {
		const hidden = this.props.state === STATES.HIDDEN;
		if (hidden) {
			return null; // Do not render hidden controls
		}
		let value = this.props.value ? this.props.value : "";
		let truncated = false;
		if (this.isList) {
			const joined = ControlUtils.joinNewlines(value, arrayValueDelimiter);
			value = joined.value;
			truncated = joined.truncated;
		} else {
			value = ControlUtils.truncateDisplayValue(value);
			truncated = value.length !== 0 && value.length !== this.props.value.length;
		}
		const className = classNames("properties-textfield", "properties-input-control", { "hide": hidden },
			this.props.messageInfo ? this.props.messageInfo.type : null);

		let textInput = null;
		if (truncated) {
			const errorMessage = {
				text: formatMessage(this.reactIntl, MESSAGE_KEYS.TRUNCATE_LONG_STRING_ERROR, { truncate_limit: TRUNCATE_LIMIT }),
				type: CONDITION_MESSAGE_TYPE.ERROR,
				validation_id: this.props.control.name
			};
			textInput = (<div className="properties-textinput-readonly">
				{this.props.tableControl ? null : this.props.controlItem}
				<ReadonlyControl
					control={this.props.control}
					propertyId={this.props.propertyId}
					controller={this.props.controller}
					tableControl={this.props.tableControl}
				/>
				{/* // TODO this could conflict with the below ValidationMessage. */}
				<ValidationMessage inTable={this.props.tableControl} state={""} messageInfo={errorMessage} />
			</div>);
		} else {
			const validationProps = ControlUtils.getValidationProps(this.props.messageInfo, this.props.tableControl);
			textInput = (
				<TextInput
					{...validationProps}
					autoComplete={this.props.tableControl === true ? "off" : "on"}
					id={this.id}
					disabled={ this.props.state === STATES.DISABLED}
					placeholder={this.props.control.additionalText}
					helperText={this.props.control.helperText}
					onChange={this.handleChange.bind(this)}
					value={value}
					labelText={this.props.controlItem}
					hideLabel={this.props.tableControl}
					aria-label={this.props.control.labelVisible ? null : this.props.control?.label?.text}
					ref={this.textInputRef}
					readOnly={this.props.readOnly}
				/>
			);

			if (this.props.tableControl) {
				const tooltipProps = {
					truncatedRef: this.textInputRef
				};
				let disabled = true;
				if (value && this.props.state !== STATES.DISABLED) {
					disabled = false;
				}
				textInput = (<TruncatedContentTooltip
					{...tooltipProps}
					content={textInput}
					tooltipText={value}
					disabled={disabled}
				/>);
			}
		}

		return (
			<div className={className} data-id={ControlUtils.getDataId(this.props.propertyId)}>
				{textInput}
				<ValidationMessage inTable={this.props.tableControl} tableOnly state={this.props.state} messageInfo={this.props.messageInfo} />
			</div>
		);
	}
}

TextfieldControl.propTypes = {
	control: PropTypes.object.isRequired,
	propertyId: PropTypes.object.isRequired,
	controller: PropTypes.object.isRequired,
	controlItem: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.element
	]), // list control passes string
	tableControl: PropTypes.bool,
	state: PropTypes.string, // pass in by redux
	value: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.array
	]), // pass in by redux
	messageInfo: PropTypes.object, // pass in by redux
	readOnly: PropTypes.bool
};


const mapStateToProps = (state, ownProps) => ({
	value: ownProps.controller.getPropertyValue(ownProps.propertyId),
	state: ownProps.controller.getControlState(ownProps.propertyId),
	messageInfo: ownProps.controller.getErrorMessage(ownProps.propertyId)
});

export default connect(mapStateToProps, null)(TextfieldControl);
