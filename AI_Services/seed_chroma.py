import chromadb
from chromadb.config import Settings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from config import settings


def seed_database():
    print("Connecting to Google Cloud for embeddings...")
    api_key = settings.BACKUP_GEMINI_KEY or settings.GEMINI_API_KEY
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001", google_api_key=api_key
    )

    print("Connecting to ChromaDB...")
    chroma_client = chromadb.HttpClient(
        host="chromadb", port=8000, settings=Settings(anonymized_telemetry=False)
    )

    vectorstore = Chroma(
        client=chroma_client,
        collection_name="mycalo_app_knowledge",
        embedding_function=embeddings,
    )

    # 1. --- App Support & Policies (10 New Entries) ---
    support_docs = [
        Document(
            page_content="To sync with Apple Health or Google Fit, go to Settings > Integrations and toggle the 'Sync Health Data' switch.",
            metadata={"category": "support", "topic": "integrations"},
        ),
        Document(
            page_content="Subscription Policy: The MyCalo AI Basic plan is free. Premium features like AI-image analysis have a monthly limit of 50 scans.",
            metadata={"category": "policy", "topic": "billing"},
        ),
        Document(
            page_content="Data Export: You can download your entire nutrition history as a CSV file by going to Settings > Data Privacy > Export My Data.",
            metadata={"category": "support", "topic": "data"},
        ),
        Document(
            page_content="If the barcode scanner fails to recognize a product, use the 'Manual Entry' option or take a clear photo for AI analysis.",
            metadata={"category": "support", "topic": "troubleshooting"},
        ),
        Document(
            page_content="Our AI-powered calorie estimation has a typical accuracy margin of +/- 10%. Always double-check measurements for medical needs.",
            metadata={"category": "policy", "topic": "accuracy"},
        ),
        Document(
            page_content="To change your daily calorie goal, navigate to the Profile tab, select 'Edit Goals', and update your target weight or activity level.",
            metadata={"category": "navigation", "topic": "goals"},
        ),
        Document(
            page_content="Password Reset: If you are logged out, click 'Forgot Password' on the login screen to receive a reset link via your registered email.",
            metadata={"category": "support", "topic": "account"},
        ),
        Document(
            page_content="You can enable 'Meal Reminders' in Settings > Notifications to receive alerts for breakfast, lunch, and dinner logging.",
            metadata={"category": "navigation", "topic": "notifications"},
        ),
        Document(
            page_content="Offline Mode: You can view your logs offline, but AI analysis and cloud syncing require an active internet connection.",
            metadata={"category": "policy", "topic": "connectivity"},
        ),
        Document(
            page_content="To change the app language, go to Settings > General > Language. We currently support English, Spanish, and Arabic.",
            metadata={"category": "navigation", "topic": "general"},
        ),
    ]

    # 2. --- Recipes & Plans (Sample Batch - Expand this to 100) ---
    recipe_data = [
        # Breakfast
        {
            "title": "High-Protein Overnight Oats",
            "content": "Mix 1/2 cup rolled oats, 1 scoop vanilla whey protein, 1/2 cup almond milk, and 1 tsp chia seeds. Refrigerate overnight. Top with berries.",
            "calories": 350,
            "type": "breakfast",
        },
        {
            "title": "Veggie Egg Scramble",
            "content": "Whisk 3 eggs with spinach, bell peppers, and 1 tbsp feta cheese. Scramble in a non-stick pan with a dash of olive oil.",
            "calories": 280,
            "type": "breakfast",
        },
        {
            "title": "Greek Yogurt Parfait",
            "content": "Layer 1 cup non-fat Greek yogurt with 1/4 cup low-sugar granola and a handful of sliced strawberries.",
            "calories": 240,
            "type": "breakfast",
        },
        # Lunch
        {
            "title": "Quinoa & Black Bean Bowl",
            "content": "1 cup cooked quinoa, 1/2 cup black beans, corn, diced avocado, and lime juice. High in fiber and plant-based protein.",
            "calories": 420,
            "type": "lunch",
        },
        {
            "title": "Grilled Chicken Caesar Wrap",
            "content": "Grilled chicken breast, romaine lettuce, 1 tbsp light Caesar dressing in a whole-wheat tortilla.",
            "calories": 380,
            "type": "lunch",
        },
        {
            "title": "Lentil Soup",
            "content": "Slow-cooked brown lentils with carrots, celery, onions, and vegetable broth. Season with cumin and turmeric.",
            "calories": 310,
            "type": "lunch",
        },
        # Dinner
        {
            "title": "Baked Salmon with Asparagus",
            "content": "Season salmon fillet with lemon and garlic. Bake at 400°F (200°C) with asparagus spears for 15 minutes.",
            "calories": 450,
            "type": "dinner",
        },
        {
            "title": "Lean Beef Stir-Fry",
            "content": "Sauté lean beef strips with broccoli, snap peas, and low-sodium soy sauce. Serve over a small portion of brown rice.",
            "calories": 490,
            "type": "dinner",
        },
        {
            "title": "Tofu Stir-fry with Peanut Sauce",
            "content": "Crispy tofu blocks tossed with bok choy and a light peanut-ginger sauce. Serve over cauliflower rice.",
            "calories": 360,
            "type": "dinner",
        },
        # Snacks
        {
            "title": "Apple Slices with Almond Butter",
            "content": "One medium apple sliced with 1 tablespoon of unsalted almond butter.",
            "calories": 190,
            "type": "snack",
        },
        {
            "title": "Cottage Cheese with Pineapple",
            "content": "1/2 cup low-fat cottage cheese topped with 1/4 cup fresh pineapple chunks.",
            "calories": 140,
            "type": "snack",
        },
        # Add more recipes here to reach 100...
        # --- BREAKFAST (12) ---
        {
            "title": "Berry Protein Smoothie",
            "content": "Blend 1 cup frozen mixed berries, 1 scoop vanilla protein powder, 1 cup spinach, and 1 cup water or almond milk.",
            "calories": 290,
            "type": "breakfast",
        },
        {
            "title": "Peanut Butter Banana Toast",
            "content": "1 slice whole-grain toast topped with 1 tbsp natural peanut butter and half a sliced banana.",
            "calories": 280,
            "type": "breakfast",
        },
        {
            "title": "Spinach and Feta Omelet",
            "content": "2 eggs whisked with a handful of fresh spinach and 1 tbsp crumbled feta cheese. Cook in a light spray of olive oil.",
            "calories": 220,
            "type": "breakfast",
        },
        {
            "title": "Chia Seed Pudding",
            "content": "Mix 3 tbsp chia seeds with 1 cup unsweetened coconut milk and a drop of vanilla extract. Let sit overnight. Top with mango.",
            "calories": 310,
            "type": "breakfast",
        },
        {
            "title": "Breakfast Burrito",
            "content": "Scramble 2 eggs with black beans and salsa. Wrap in a small whole-wheat tortilla with a slice of avocado.",
            "calories": 410,
            "type": "breakfast",
        },
        {
            "title": "Apple Cinnamon Porridge",
            "content": "Cook 1/2 cup steel-cut oats with water. Stir in 1 diced apple, cinnamon, and a few crushed walnuts.",
            "calories": 320,
            "type": "breakfast",
        },
        {
            "title": "Smoked Salmon Avocado Toast",
            "content": "1 slice rye bread topped with 1/4 mashed avocado and 2 oz smoked salmon. Garnish with red onion and capers.",
            "calories": 340,
            "type": "breakfast",
        },
        {
            "title": "Cottage Cheese & Peach Bowl",
            "content": "1 cup low-fat cottage cheese topped with 1 fresh sliced peach and a sprinkle of cinnamon.",
            "calories": 190,
            "type": "breakfast",
        },
        {
            "title": "Protein Pancakes",
            "content": "Mix 1 mashed banana, 2 eggs, and 1/4 cup oat flour. Cook on a griddle like standard pancakes. Top with blueberries.",
            "calories": 330,
            "type": "breakfast",
        },
        {
            "title": "Tofu Breakfast Scramble",
            "content": "Crumble firm tofu and sauté with turmeric, nutritional yeast, kale, and diced tomatoes.",
            "calories": 250,
            "type": "breakfast",
        },
        {
            "title": "Shakshuka (Single Serving)",
            "content": "Poach 2 eggs in a spicy tomato and bell pepper sauce. Season with cumin and fresh parsley.",
            "calories": 280,
            "type": "breakfast",
        },
        {
            "title": "Turkey Sausage & Sweet Potato Hash",
            "content": "Dice 1 small sweet potato and sauté with 2 lean turkey sausage patties and onions until tender.",
            "calories": 390,
            "type": "breakfast",
        },
        # --- LUNCH (13) ---
        {
            "title": "Mediterranean Chickpea Salad",
            "content": "Combine canned chickpeas, cucumber, cherry tomatoes, olives, and red onion. Dress with lemon juice and dried oregano.",
            "calories": 340,
            "type": "lunch",
        },
        {
            "title": "Tuna Salad Lettuce Wraps",
            "content": "Mix 1 can tuna with 1 tbsp Greek yogurt and celery. Scoop into large Romaine lettuce leaves.",
            "calories": 210,
            "type": "lunch",
        },
        {
            "title": "Caprese Sandwich",
            "content": "Whole-grain baguette with fresh mozzarella, sliced tomato, fresh basil leaves, and a drizzle of balsamic glaze.",
            "calories": 420,
            "type": "lunch",
        },
        {
            "title": "Miso Soup with Silken Tofu",
            "content": "Miso broth with silken tofu cubes, seaweed, and chopped green onions. Light and hydrating.",
            "calories": 150,
            "type": "lunch",
        },
        {
            "title": "Turkey & Swiss Whole-Grain Wrap",
            "content": "3 oz deli turkey, 1 slice Swiss cheese, spinach, and mustard in a flax-seed wrap.",
            "calories": 310,
            "type": "lunch",
        },
        {
            "title": "Roasted Vegetable Medley",
            "content": "Roasted zucchini, eggplant, bell peppers, and carrots tossed in 1 tsp olive oil and balsamic vinegar.",
            "calories": 220,
            "type": "lunch",
        },
        {
            "title": "Lemon Garlic Shrimp Skewers",
            "content": "Grilled shrimp marinated in lemon, garlic, and parsley. Serve with a side of mixed greens.",
            "calories": 260,
            "type": "lunch",
        },
        {
            "title": "Quinoa & Pomegranate Salad",
            "content": "Cold quinoa tossed with pomegranate seeds, fresh mint, cucumber, and a light lemon dressing.",
            "calories": 330,
            "type": "lunch",
        },
        {
            "title": "Black Bean & Corn Salsa Bowl",
            "content": "Mix black beans, corn, diced red pepper, cilantro, and lime. Serve over 1/2 cup brown rice.",
            "calories": 380,
            "type": "lunch",
        },
        {
            "title": "Egg Salad Sandwich (Light)",
            "content": "2 hard-boiled eggs mashed with 1 tbsp Greek yogurt and dijon mustard on whole-grain bread.",
            "calories": 350,
            "type": "lunch",
        },
        {
            "title": "Chicken Noodle Soup (Clear Broth)",
            "content": "Shredded chicken breast, carrots, celery, and a small amount of rotini noodles in a low-sodium chicken broth.",
            "calories": 290,
            "type": "lunch",
        },
        {
            "title": "Falafel Pita Pocket",
            "content": "3 baked falafels in a whole-wheat pita with diced tomatoes, cucumber, and a dollop of hummus.",
            "calories": 410,
            "type": "lunch",
        },
        {
            "title": "Cobb Salad (No Bacon)",
            "content": "Grilled chicken, hard-boiled egg, avocado, tomatoes, and blue cheese over a bed of mixed greens.",
            "calories": 440,
            "type": "lunch",
        },
        # --- DINNER (15) ---
        {
            "title": "Spaghetti Squash with Marinara",
            "content": "Roasted spaghetti squash strands topped with 1/2 cup marinara sauce and fresh basil.",
            "calories": 240,
            "type": "dinner",
        },
        {
            "title": "Teriyaki Tofu Stir-Fry",
            "content": "Firm tofu cubes sautéed with snap peas, carrots, and 1 tbsp low-sugar teriyaki sauce. Serve with cauliflower rice.",
            "calories": 310,
            "type": "dinner",
        },
        {
            "title": "Turkey Meatballs & Zoodles",
            "content": "Baked lean turkey meatballs served over spiralized zucchini with a light tomato sauce.",
            "calories": 350,
            "type": "dinner",
        },
        {
            "title": "Lemon Herb Baked Cod",
            "content": "Cod fillet seasoned with dried thyme, lemon, and black pepper. Serve with steamed green beans.",
            "calories": 280,
            "type": "dinner",
        },
        {
            "title": "Vegetable Chickpea Curry",
            "content": "Chickpeas, cauliflower, and peas simmered in a coconut milk and curry powder sauce. Serve with 1/2 cup basmati rice.",
            "calories": 460,
            "type": "dinner",
        },
        {
            "title": "Beef and Broccoli",
            "content": "Lean flank steak strips sautéed with ginger, garlic, and plenty of broccoli florets in a savory sauce.",
            "calories": 420,
            "type": "dinner",
        },
        {
            "title": "Zucchini Noodles with Pesto",
            "content": "Spiralized zucchini tossed with 2 tbsp basil pesto and toasted pine nuts.",
            "calories": 290,
            "type": "dinner",
        },
        {
            "title": "Roast Chicken with Root Veg",
            "content": "Chicken thigh (skinless) roasted with parsnips, carrots, and rosemary.",
            "calories": 480,
            "type": "dinner",
        },
        {
            "title": "Mushroom Risotto (Healthy Version)",
            "content": "Arborio rice cooked with vegetable stock, sautéed mushrooms, and a touch of parmesan cheese.",
            "calories": 410,
            "type": "dinner",
        },
        {
            "title": "Sweet Potato Chili",
            "content": "Vegetarian chili made with sweet potato chunks, kidney beans, tomatoes, and chili spices.",
            "calories": 370,
            "type": "dinner",
        },
        {
            "title": "Stuffed Bell Peppers",
            "content": "Bell peppers stuffed with lean ground turkey, onions, and diced tomatoes. Bake until tender.",
            "calories": 340,
            "type": "dinner",
        },
        {
            "title": "Pan-Seared Scallops",
            "content": "Large scallops seared in a pan with minimal butter. Serve with a side of sautéed spinach and garlic.",
            "calories": 260,
            "type": "dinner",
        },
        {
            "title": "Ratatouille",
            "content": "Stewed eggplant, zucchini, onions, bell peppers, and tomatoes. High in volume and low in calories.",
            "calories": 210,
            "type": "dinner",
        },
        {
            "title": "Chicken Souvlaki",
            "content": "Grilled chicken chunks marinated in lemon and garlic. Serve with a side of tzatziki sauce.",
            "calories": 320,
            "type": "dinner",
        },
        {
            "title": "Black Bean Tacos",
            "content": "Corn tortillas filled with seasoned black beans, cabbage slaw, and a spoonful of Greek yogurt.",
            "calories": 390,
            "type": "dinner",
        },
        # --- SNACKS (10) ---
        {
            "title": "Hummus and Baby Carrots",
            "content": "2 tbsp traditional hummus served with 10 crunchy baby carrots.",
            "calories": 110,
            "type": "snack",
        },
        {
            "title": "Mixed Trail Mix",
            "content": "A small handful (1 oz) of raw almonds, walnuts, and a few dried cranberries.",
            "calories": 160,
            "type": "snack",
        },
        {
            "title": "Hard-Boiled Egg",
            "content": "One large hard-boiled egg seasoned with a pinch of sea salt and pepper.",
            "calories": 78,
            "type": "snack",
        },
        {
            "title": "Steamed Edamame",
            "content": "1/2 cup steamed soybeans in the pod, lightly salted.",
            "calories": 95,
            "type": "snack",
        },
        {
            "title": "Rice Cake with Peanut Butter",
            "content": "One plain brown rice cake topped with 1 tsp natural peanut butter.",
            "calories": 105,
            "type": "snack",
        },
        {
            "title": "Greek Olives",
            "content": "A portion of 10 Kalamata olives. Great for healthy fats.",
            "calories": 90,
            "type": "snack",
        },
        {
            "title": "Cucumber Slices with Vinegar",
            "content": "Sliced cucumber tossed in rice vinegar, salt, and a dash of chili flakes.",
            "calories": 45,
            "type": "snack",
        },
        {
            "title": "Beef Jerky (Lean)",
            "content": "1 oz of high-protein, low-sugar lean beef jerky.",
            "calories": 80,
            "type": "snack",
        },
        {
            "title": "Frozen Grapes",
            "content": "1 cup of red or green grapes, frozen for a sweet, cold snack.",
            "calories": 104,
            "type": "snack",
        },
        {
            "title": "Walnut Halves",
            "content": "7 whole walnut halves. Excellent source of Omega-3 fatty acids.",
            "calories": 185,
            "type": "snack",
        },
    ]

    recipe_docs = [
        Document(
            page_content=f"Recipe: {r['title']}. Instructions: {r['content']}",
            metadata={
                "category": "recipe",
                "meal_type": r["type"],
                "calories": r["calories"],
            },
        )
        for r in recipe_data
    ]

    # Combine all documents
    full_knowledge_base = support_docs + recipe_docs

    print(f"Adding {len(full_knowledge_base)} documents to Vector Database...")
    vectorstore.add_documents(full_knowledge_base)
    print("✅ Successfully seeded ChromaDB with Recipes and App Knowledge!")


if __name__ == "__main__":
    seed_database()
