'use strict';
const { query, queryRead } = require('../../db/pool');
const { NotFoundError }    = require('../../shared/errors/AppError');
const { makeSlug }         = require('../../shared/utils');

const listCategories = async (parentId = null) => {
  const { rows } = await queryRead(
    `SELECT * FROM listing_categories
      WHERE ($1::UUID IS NULL OR parent_id=$1) AND is_active=TRUE
      ORDER BY sort_order ASC, name ASC`,
    [parentId]
  );
  return rows;
};

const getCategoryTree = async () => {
  const { rows } = await queryRead(
    `SELECT c.*, parent.name AS parent_name
       FROM listing_categories c
       LEFT JOIN listing_categories parent ON parent.id = c.parent_id
      WHERE c.is_active = TRUE
      ORDER BY c.depth, c.sort_order`
  );
  // Build tree
  const map = {};
  rows.forEach((r) => (map[r.id] = { ...r, children: [] }));
  const roots = [];
  rows.forEach((r) => {
    if (r.parent_id && map[r.parent_id]) map[r.parent_id].children.push(map[r.id]);
    else if (!r.parent_id) roots.push(map[r.id]);
  });
  return roots;
};

const getCategoryBySlug = async (slug) => {
  const { rows } = await queryRead(`SELECT * FROM listing_categories WHERE slug=$1`, [slug]);
  if (!rows.length) throw new NotFoundError('Category');
  return rows[0];
};

const createCategory = async (data) => {
  const slug = data.slug || makeSlug(data.name, false);
  const { rows } = await query(
    `INSERT INTO listing_categories (parent_id, name, slug, description, icon_name, sort_order, depth, seo_title, seo_description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.parent_id || null, data.name, slug, data.description || null,
     data.icon_name || null, data.sort_order || 0, data.depth || 0,
     data.seo_title || null, data.seo_description || null]
  );
  return rows[0];
};

const updateCategory = async (id, data) => {
  const { rows } = await query(
    `UPDATE listing_categories
        SET name=COALESCE($1,name), description=COALESCE($2,description),
            icon_name=COALESCE($3,icon_name), sort_order=COALESCE($4,sort_order),
            is_active=COALESCE($5,is_active), seo_title=COALESCE($6,seo_title),
            seo_description=COALESCE($7,seo_description), updated_at=NOW()
      WHERE id=$8 RETURNING *`,
    [data.name, data.description, data.icon_name, data.sort_order,
     data.is_active, data.seo_title, data.seo_description, id]
  );
  if (!rows.length) throw new NotFoundError('Category');
  return rows[0];
};

const deleteCategory = async (id) => {
  // Check no listings use this category
  const { rows: used } = await query(`SELECT id FROM listings WHERE category_id=$1 AND deleted_at IS NULL LIMIT 1`, [id]);
  if (used.length) throw new Error('Cannot delete category with active listings');
  await query(`DELETE FROM listing_categories WHERE id=$1`, [id]);
  return { message: 'Category deleted' };
};

module.exports = { listCategories, getCategoryTree, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
