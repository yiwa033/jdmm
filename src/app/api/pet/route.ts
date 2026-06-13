import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Get pet state
export async function GET() {
  try {
    let pet = await db.petState.findFirst()
    if (!pet) {
      // Auto-create pet on first visit
      pet = await db.petState.create({
        data: {},
      })
    }

    // Calculate attribute decay based on time elapsed
    const now = new Date()
    const lastFed = new Date(pet.lastFedAt)
    const lastPet = new Date(pet.lastPetAt)

    // Happiness decays: -1 every 2 hours since last pet
    const hoursSincePet = (now.getTime() - lastPet.getTime()) / (1000 * 60 * 60)
    const happinessDecay = Math.min(Math.floor(hoursSincePet / 2), 50)
    const happiness = Math.max(pet.happiness - happinessDecay, 0)

    // Fullness decays: -1 every 1.5 hours since last fed
    const hoursSinceFed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60)
    const fullnessDecay = Math.min(Math.floor(hoursSinceFed / 1.5), 60)
    const fullness = Math.max(pet.fullness - fullnessDecay, 0)

    // Energy recovers: +1 every 3 hours (resting)
    const energyBoost = Math.min(Math.floor(hoursSinceFed / 3), 30)
    const energy = Math.min(pet.energy + energyBoost, 100)

    // Update pet with decayed values
    const updatedPet = await db.petState.update({
      where: { id: pet.id },
      data: { happiness, fullness, energy },
    })

    return NextResponse.json(updatedPet)
  } catch (error) {
    console.error('Get pet error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// Update pet state (feed, pet, choose type)
export async function POST(request: Request) {
  try {
    const { action, petType, name } = await request.json()

    let pet = await db.petState.findFirst()
    if (!pet) {
      pet = await db.petState.create({ data: {} })
    }

    const updateData: Record<string, unknown> = {}

    if (petType) updateData.petType = petType
    if (name) updateData.name = name

    if (action === 'feed') {
      updateData.fullness = Math.min(pet.fullness + 20, 100)
      updateData.happiness = Math.min(pet.happiness + 5, 100)
      updateData.lastFedAt = new Date()
      updateData.exp = pet.exp + 10
    } else if (action === 'pet') {
      updateData.happiness = Math.min(pet.happiness + 15, 100)
      updateData.lastPetAt = new Date()
      updateData.exp = pet.exp + 5
    } else if (action === 'play') {
      updateData.happiness = Math.min(pet.happiness + 10, 100)
      updateData.energy = Math.max(pet.energy - 10, 0)
      updateData.fullness = Math.max(pet.fullness - 5, 0)
      updateData.lastPetAt = new Date()
      updateData.exp = pet.exp + 15
    } else if (action === 'diary') {
      // Called when writing a diary entry — pet gets happy!
      updateData.happiness = Math.min(pet.happiness + 10, 100)
      updateData.exp = pet.exp + 20
      updateData.diaryCount = pet.diaryCount + 1
      updateData.lastPetAt = new Date()
    }

    // Level up check: every 100 exp = 1 level
    const newExp = (updateData.exp as number) ?? pet.exp
    const currentLevel = pet.level
    const newLevel = Math.floor(newExp / 100) + 1
    if (newLevel > currentLevel) {
      updateData.level = newLevel
    }

    const updatedPet = await db.petState.update({
      where: { id: pet.id },
      data: updateData,
    })

    return NextResponse.json(updatedPet)
  } catch (error) {
    console.error('Update pet error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
