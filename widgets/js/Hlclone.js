class Hlclone_Hlclone extends Widget {

	ANIMATION = null

	constructor(uid, widgetId) {
		super(uid, widgetId)
		this._numLeds = 15
		this._image = Array(15)
		this._leds = []
		this.wakeup()
		this.subscribe(this.TOPIC_HOTWORD_TOGGLE_OFF, this.onHotword)
		this.subscribe(this.TOPIC_HOTWORD_TOGGLE_ON, this.onIdle)
		this.subscribe(this.TOPIC_ASR_START_LISTENING, this.onListen)
		this.subscribe(this.TOPIC_TEXT_CAPTURED, this.onThink)
		this.subscribe(this.TOPIC_TTS_SAY, this.onSpeak)
		this.subscribe(this.TOPIC_SYSTEM_UPDATE, this.onUpdate)
	}

	getLeds() {
		for (let i = 1; i <= this._numLeds; i++) {
			this._leds.push(document.getElementById(`led_${i}`))
		}
	}

	onHotword() {
		this.wakeup()
	}

	onUpdate() {
		let image = [
			[255, 0, 0, 0.2],
			[255, 0, 0, 0.4],
			[255, 0, 0, 1],
			[255, 0, 0, 0.4],
			[255, 0, 0, 0.2]
		]

		while (image.length < this._numLeds) {
			image.push([0, 0, 0, 0])
		}
		this._image = image
		this.show()

		clearInterval(this.ANIMATION)
		let self = this
		this.ANIMATION = setInterval(function() {
			self.rotateImage(1)
		}, 50)
	}

	onListen() {
		let self = this
		let waitTime = this.doubleSidedFilling([0, 0, 255, 1], 0, 1, 50)
		setTimeout(function() {
			self.breath([0, 0, 255, 1], 0.3, 1, 100)
		}, waitTime)
	}

	onThink() {
		this.rotate([0, 0, 255, 1], 70, Math.ceil(this._numLeds / 3))
	}

	onIdle() {
		this.off()
	}

	onError() {
		this.blink()
	}

	onSpeak() {
		this.breath([255, 255, 255, 1], 0.3, 1, 100)
	}

	wakeup() {
		let self = this
		this.off()
		let waitTime = this.doubleSidedFilling([255, 255, 255, 0.6], 0, 1, 50)
		setTimeout(function() {
			waitTime = self.doubleSidedFilling([0, 0, 255, 1], 8, -1, 50, false)

			setTimeout(function() {
				waitTime = self.doubleSidedFilling([0, 0, 0, 0], 0, 1, 50, false)
			}, waitTime)
		}, waitTime)
	}

	idle() {
		this.off()
	}

	off() {
		clearInterval(this.ANIMATION)
		this.newImage()
		this.show()
	}

	newImage(filler = null) {
		if (filler) {
			this._image.fill(filler)
		} else {
			this._image.fill([0, 0, 0, 0])
		}
	}

	setPixel(index, color) {
		if (index > this._numLeds - 1) {
			console.warn('Tried to set led out of array bound')
			return
		}
		this._image[index] = color
	}

	show() {
		if (this._leds.length <= 0) {
			this.getLeds()
		}
		this._image.forEach((led, i) => {
			const [r, g, b, a] = led
			this._leds[i].style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`
		})
	}

	normalizeIndex(index) {
		if (index < 0) {
			return this._numLeds - Math.abs(index)
		} else if (index >= this._numLeds) {
			return index - this._numLeds
		} else {
			return index
		}
	}

	oppositeLed(self, index) {
		return this.normalizeIndex(index + Math.round(this._numLeds / 2))
	}

	range(start, stop, step) {
		if (typeof stop == 'undefined') {
			stop = start
			start = 0
		}

		if (typeof step == 'undefined') {
			step = 1
		}

		if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
			return []
		}

		let result = [];
		for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
			result.push(i)
		}

		return result
	}

	doubleSidedFilling(color, startAt = 0, direction = 1, speed = 50, newImage = true) {
		clearInterval(this.ANIMATION)

		let ranged = this.range(Math.round(this._numLeds / 2) + 1)
		if (direction <= 0) {
			ranged = ranged.reverse()
		}

		if (newImage) {
			this.newImage()
		}

		let index = startAt
		let oppositeLed = this.oppositeLed(startAt)
		let self = this

		let j = 0
		let waitTime = 0
		for (const i of ranged.keys()) {
			setTimeout(function() {
				let positive = self.normalizeIndex(index + i)
				let negative = self.normalizeIndex(index - i)

				if (positive === startAt || positive === oppositeLed){
					self._image[positive] = [color[0], color[1], color[2], color[3]]
				} else {
					self._image[positive] = [color[0], color[1], color[2], color[3]]
					self._image[negative] = [color[0], color[1], color[2], color[3]]
				}
				self.show()
			}, waitTime)
			j++
			waitTime = speed * j
		}
		return waitTime
	}


	rotate(color, speed = 150, trail = 0, startAt = 0) {
		let self = this
		if (trail > this._numLeds) {
			trail = this._numLeds
		}

		if (startAt > this._numLeds - 1) {
			startAt = 0
		}

		let fullBrightness = color[3]

		clearInterval(self.ANIMATION)
		this.ANIMATION = setInterval(function() {
			let index = startAt
			self.off()
			self.setPixel(index, color)
			let rotationSign = -1
			if (speed >= 0) {
				rotationSign = 1
			}

			if (trail > 0) {
				for (let i = 1; i <= trail; i++) {
					let trailIndex = self.normalizeIndex(index - i * rotationSign)
					let faded = [color[0], color[1], color[2], fullBrightness / (i + 1)]
					self.setPixel(trailIndex, faded)
				}
			}
			self.show()
			startAt++
			if (startAt > self._numLeds - 1) {
				startAt = 0
			}
		}, speed)
	}


	breath(color, minBrightness, maxBrightness, speed) {
		let self = this
		this.newImage(color)

		let direction = 1
		let bri = color[3]
		clearInterval(self.ANIMATION)
		this.ANIMATION = setInterval(function() {
			if (bri >= maxBrightness) {
				direction = -0.1
			} else if (bri <= minBrightness) {
				direction = 0.1
			}

			bri += direction
			for (let i = 0; i < self._numLeds; i++) {
				self._image[i] = [color[0], color[1], color[2], bri]
			}

			self.show()
		}, speed)
	}

	rotateImage(step, preventDisplay = false) {
		if (step === 0) {
			console.warn('Cannot rotate image by 0 degrees')
			return
		}

		if (step > 0) {
			for (let i = 0; i < step; i++) {
				this._image.unshift(this._image.pop())
			}
		} else {
			for (let i = 0; i < Math.abs(step); i++) {
				this._image.push(this._image.shift())
			}
		}

		if (!preventDisplay) {
			this.show()
		}
	}
}
