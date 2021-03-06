import React, { Component } from 'react'
import shallowCompare from 'react-addons-shallow-compare'
import ReactDOM from 'react-dom'
import maka from './maka'
import config from './config'
import utils from '@makajs/utils'

function getHandler(props, eventName) {
	return (...args) => {
		if (props[eventName]) {
			props[eventName](...args)
			return
		}

		if (props.base&& props.base.getAllAction) {
			var action = props.base.getAllAction()[eventName]
			if (action) {
				action(...args)
				return
			}
		}
	}

}

export default function wrapper(option) {
	return WrappedComponent => {
		var WC = WrappedComponent
		return class internal extends Component {

			constructor(props) {
				super(props)
				this.state = { hasError: false }
			}

			componentWillMount() {
				getHandler(this.props, 'componentWillMount')()
			}

			componentDidMount() {
				this.props.initView && this.props.initView(this)
				getHandler(this.props, 'componentDidMount')()
			}

			shouldComponentUpdate(nextProps, nextState) {
				if (this.props.shouldComponentUpdate
					&& this.props.shouldComponentUpdate(nextProps, nextState) === true)
					return true

				else if(this.props.shouldComponentUpdate
					&& this.props.shouldComponentUpdate(nextProps, nextState) === false)
					return false

				if (nextState.hasError != this.state.hasError) {
					return true
				}

				return shallowCompare(this, nextProps, nextState);
				/*
				for (var o in this.props) {
					if (this.props[o] != nextProps[o]) {
						return true
					}
				}
				return false
				*/
			}


			componentWillReceiveProps(nextProps) {
				if (this.state.hasError) {
					this.setState({ hasError: false, error: undefined })
				}

				getHandler(this.props, 'componentWillReceiveProps')(nextProps)
			}

			componentWillUpdate(nextProps, nextState) {
				getHandler(this.props, 'componentWillUpdate')(nextProps, nextState)
			}

			componentDidCatch(error, info) {
				utils.exception.error(error)
				this.setState({ hasError: true, error })

				getHandler(this.props, 'componentDidCatch')(error, info)
			}


			componentWillUnmount() {
				this.props.unmount && this.props.unmount()

				getHandler(this.props, 'componentWillUnmount')()
			}

			componentDidUpdate() {
				getHandler(this.props, 'componentDidUpdate')()
			}

			render() {
				if (this.state.hasError) {
					return <div style={{ color: 'red' }}>{this.state.error && this.state.error.message}</div>
				}

				if (this.props.notRender === true || this.props._notRender === true)
					return null

				if (!WC)
					return null

				if (!this.props.payload || !this.props.payload.get('data'))
					return null

				if (this.props.payload.getIn(['data', '_notRender']) === true)
					return null

				return <WC {...this.props} maka={maka} />
			}
		}
	}
}

